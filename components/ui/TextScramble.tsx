'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

interface TextScrambleProps {
  text: string;
  className?: string;
  trigger?: 'hover' | 'mount' | 'both';
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,./<>?';

export function TextScramble({
  text,
  className = '',
  trigger = 'both',
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const isAnimating = useRef(false);
  const frameRef = useRef<number | null>(null);

  const startScramble = useCallback(() => {
    if (isAnimating.current) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    }

    isAnimating.current = true;
    let iteration = 0;
    const target = text;

    const animate = () => {
      setDisplayText(
        target
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return target[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration >= target.length) {
        isAnimating.current = false;
      } else {
        iteration += 1 / 3; // Gradual resolution
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  }, [text]);

  useEffect(() => {
    if (trigger === 'mount' || trigger === 'both') {
      startScramble();
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [startScramble, trigger]);

  const handleMouseEnter = () => {
    if (trigger === 'hover' || trigger === 'both') {
      startScramble();
    }
  };

  return (
    <span onMouseEnter={handleMouseEnter} className={className}>
      {displayText}
    </span>
  );
}
