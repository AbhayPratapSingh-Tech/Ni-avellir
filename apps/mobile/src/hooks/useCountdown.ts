import { useEffect, useState } from 'react';

export interface CountdownParts {
  hours: string;
  minutes: string;
  seconds: string;
}

function remainingMs(targetEpochMs: number): number {
  return Math.max(0, targetEpochMs - Date.now());
}

function toParts(ms: number): CountdownParts {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

/**
 * Returns a ticking HH:MM:SS countdown to a stable target timestamp.
 * The target must not be recreated on every render.
 */
export function useCountdown(targetEpochMs: number): CountdownParts {
  const [remaining, setRemaining] = useState(() => remainingMs(targetEpochMs));

  useEffect(() => {
    setRemaining(remainingMs(targetEpochMs));
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = remainingMs(targetEpochMs);
        return Math.floor(prev / 1000) === Math.floor(next / 1000) ? prev : next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetEpochMs]);

  return toParts(remaining);
}
