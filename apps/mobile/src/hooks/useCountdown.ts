import { useEffect, useState } from 'react';

export interface CountdownParts {
  hours: string;
  minutes: string;
  seconds: string;
}

/**
 * Returns a ticking HH:MM:SS countdown to a target timestamp.
 * Stops at 00:00:00.
 */
export function useCountdown(targetEpochMs: number): CountdownParts {
  const [remaining, setRemaining] = useState(() => Math.max(0, targetEpochMs - Date.now()));

  useEffect(() => {
    setRemaining(Math.max(0, targetEpochMs - Date.now()));
    const interval = setInterval(() => {
      setRemaining(Math.max(0, targetEpochMs - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetEpochMs]);

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}
