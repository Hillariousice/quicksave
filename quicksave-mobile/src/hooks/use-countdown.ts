import { useState, useEffect, useRef, useCallback } from 'react';

export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 👉 NEW: Extracted the start logic so we can call it again later
  const startTimer = useCallback((startAt: number) => {
    setSeconds(startAt);
    
    // Clear any existing timer before starting a new one
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer(initialSeconds);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initialSeconds, startTimer]);

  const formatTime = () => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // 👉 NEW: Return `seconds` and `resetTimer`
  return { seconds, formatTime, isFinished: seconds === 0, resetTimer: startTimer };
}