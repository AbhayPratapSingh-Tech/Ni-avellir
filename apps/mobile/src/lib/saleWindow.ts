import { useEffect, useMemo, useState } from 'react';
import { useCountdown } from '../hooks/useCountdown';

const SALE_START_HOUR = 9;
const SALE_DURATION_HOURS = 7;

export type DailySaleState = {
  active: boolean;
  endsAt: number;
  startsAt: number;
};

function atHour(base: Date, hour: number): Date {
  const next = new Date(base);
  next.setHours(hour, 0, 0, 0);
  return next;
}

export function getDailySaleWindow(now = new Date()): DailySaleState {
  const startToday = atHour(now, SALE_START_HOUR);
  const endToday = new Date(startToday.getTime() + SALE_DURATION_HOURS * 60 * 60 * 1000);

  if (now >= startToday && now < endToday) {
    return { active: true, startsAt: startToday.getTime(), endsAt: endToday.getTime() };
  }

  const nextStart = now < startToday ? startToday : new Date(startToday.getTime() + 24 * 60 * 60 * 1000);
  return { active: false, startsAt: nextStart.getTime(), endsAt: nextStart.getTime() };
}

export function useDailySale() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const windowState = useMemo(() => getDailySaleWindow(), [tick]);
  const countdown = useCountdown(windowState.active ? windowState.endsAt : windowState.startsAt);

  return { ...windowState, countdown };
}
