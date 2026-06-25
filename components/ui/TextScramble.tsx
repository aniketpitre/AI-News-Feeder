'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

interface TextScrambleProps {
  text: string;
  className?: string;
  trigger?: 'hover' | 'mount' | 'both';
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

/**
 * TextScramble — character scramble with igloo.inc-style RGB glitch flash.
 *
 * Replace components/ui/TextScramble.tsx with this file.
 * The .glitch-active keyframes live in app/globals.css (provided in this set).
 * No other files need to change.
 */
export function TextScramble({ text, className = '', trigger = 'both' }: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const isAnimating = useRef(false);
  const frameRef    = useRef<number | null>(null);
  const hasMounted  = useRef(false);
  const spanRef     = useRef<HTMLSpanElement>(null!);

  const fireGlitch = useCallback(() => {
    const el = spanRef.current;
    if (!el) return;
    // Remove first so re-triggering the same element restarts the animation
    el.classList.remove('glitch-active');
    void el.offsetWidth; // force reflow
    el.classList.add('glitch-active');
    const t = setTimeout(() => el.classList.remove('glitch-active'), 440);
    return () => clearTimeout(t);
  }, []);

  const startScramble = useCallback(() => {
    if (isAnimating.current && frameRef.current) cancelAnimationFrame(frameRef.current);
    isAnimating.current = true;

    // Fire RGB glitch flash at the very start of each scramble
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
        iteration += 1;
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
