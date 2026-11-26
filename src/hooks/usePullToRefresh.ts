import { useState, useRef, useCallback } from 'react';
import type React from 'react';

export type PullRefreshHandler = () => Promise<unknown> | void;

export interface PullRefreshCallbacks {
  onStart: () => void;
  onFinally: () => void;
}

/**
 * Pure async coordinator for pull-to-refresh without fixed timeouts.
 * Awaits the real async refresh promise and always resets state in finally.
 */
export async function runPullToRefreshCycle(
  onRefresh: PullRefreshHandler,
  callbacks: PullRefreshCallbacks
): Promise<boolean> {
  callbacks.onStart();
  try {
    await onRefresh();
    return true;
  } finally {
    callbacks.onFinally();
  }
}

export function usePullToRefresh(onRefresh: PullRefreshHandler) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const touchStartY = useRef(0);
  const mainRef = useRef<HTMLElement | null>(null);
  const pullDistanceRef = useRef(0);
  const isPullingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const updatePullDistance = useCallback((distance: number) => {
    pullDistanceRef.current = distance;
    setPullDistance(distance);
  }, []);

  const updateIsPulling = useCallback((pulling: boolean) => {
    isPullingRef.current = pulling;
    setIsPulling(pulling);
  }, []);

  const updateIsRefreshing = useCallback((refreshing: boolean) => {
    isRefreshingRef.current = refreshing;
    setIsRefreshing(refreshing);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (mainRef.current && mainRef.current.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
        updateIsPulling(true);
      }
    },
    [updateIsPulling]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPullingRef.current || isRefreshingRef.current) return;
      if (mainRef.current && mainRef.current.scrollTop === 0) {
        const diff = e.touches[0].clientY - touchStartY.current;
        if (diff > 0) {
          updatePullDistance(Math.min(diff * 0.45, 90));
        }
      }
    },
    [updatePullDistance]
  );

  const handleTouchEnd = useCallback(async (): Promise<void> => {
    if (pullDistanceRef.current <= 55 || isRefreshingRef.current) {
      updatePullDistance(0);
      updateIsPulling(false);
      return;
    }

    try {
      await runPullToRefreshCycle(() => onRefreshRef.current(), {
        onStart: () => {
          updateIsRefreshing(true);
          updatePullDistance(60);
        },
        onFinally: () => {
          updateIsRefreshing(false);
          updatePullDistance(0);
          updateIsPulling(false);
        },
      });
    } catch {
      // UI state already restored in finally; callers handle error notifications inside onRefresh
    }
  }, [updateIsPulling, updateIsRefreshing, updatePullDistance]);

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    mainRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
