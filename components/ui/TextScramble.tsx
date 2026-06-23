'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

interface TextScrambleProps {
  text: string;
  className?: string;
  trigger?: 'hover' | 'mount' | 'both';
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

/**
 * TextScramble — character-level scramble with an igloo.inc-style RGB-split
 * glitch flash that fires at the START of every scramble trigger.
 *
 * The glitch keyframes live in globals.css (.glitch-active).
 * No additional packages required.
 */
export function TextScramble({ text, className = '', trigger = 'both' }: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const isAnimating  = useRef(false);
  const frameRef     = useRef<number | null>(null);
  const hasMounted   = useRef(false);
  const spanRef      = useRef<HTMLSpanElement>(null!);

  const fireGlitch = useCallback(() => {
    const el = spanRef.current;
    if (!el) return;
    // Remove first so re-triggering the same element restarts the animation
    el.classList.remove('glitch-active');
    void el.offsetWidth; // force reflow
    el.classList.add('glitch-active');
    // Clean up after animation finishes so it can be re-triggered cleanly
    const t = setTimeout(() => el.classList.remove('glitch-active'), 420);
    return () => clearTimeout(t);
  }, []);

  const startScramble = useCallback(() => {
    if (isAnimating.current && frameRef.current) cancelAnimationFrame(frameRef.current);
    isAnimating.current = true;

    // Fire the CSS glitch flash at the very start
    fireGlitch();

    let iteration = 0;

    const animate = () => {
      setDisplayText(
        text.split('').map((char, index) => {
          if (char === ' ') return ' ';
          if (index < iteration) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('')
      );

      if (iteration >= text.length) {
        isAnimating.current = false;
        setDisplayText(text);
      } else {
        iteration += 1; // resolves 1 char per frame (~16 ms)
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  }, [text, fireGlitch]);

  useEffect(() => {
    if ((trigger === 'mount' || trigger === 'both') && !hasMounted.current) {
      hasMounted.current = true;
      startScramble();
    }
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [startScramble, trigger]);

  // Reset when text prop changes
  useEffect(() => {
    setDisplayText(text);
    hasMounted.current = false;
  }, [text]);

  const handleMouseEnter = () => {
    if (trigger === 'hover' || trigger === 'both') startScramble();
  };

  return (
    <span ref={spanRef} onMouseEnter={handleMouseEnter} className={className}>
      {displayText}
    </span>
  );
}
