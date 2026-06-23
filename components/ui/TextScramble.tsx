'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

interface TextScrambleProps {
  text: string;
  className?: string;
  trigger?: 'hover' | 'mount' | 'both';
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

export function TextScramble({ text, className = '', trigger = 'both' }: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const isAnimating = useRef(false);
  const frameRef = useRef<number | null>(null);
  const hasMounted = useRef(false);

  const startScramble = useCallback(() => {
    if (isAnimating.current && frameRef.current) cancelAnimationFrame(frameRef.current);
    isAnimating.current = true;
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
        iteration += 1; // Fast — resolves 1 char per frame (~16ms each)
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
  }, [text]);

  useEffect(() => {
    if ((trigger === 'mount' || trigger === 'both') && !hasMounted.current) {
      hasMounted.current = true;
      startScramble();
    }
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [startScramble, trigger]);

  // Reset when text changes
  useEffect(() => {
    setDisplayText(text);
    hasMounted.current = false;
  }, [text]);

  const handleMouseEnter = () => {
    if (trigger === 'hover' || trigger === 'both') startScramble();
  };

  return (
    <span onMouseEnter={handleMouseEnter} className={className}>
      {displayText}
    </span>
  );
}
