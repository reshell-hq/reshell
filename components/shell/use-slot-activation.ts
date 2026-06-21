"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  HOVER_CLOSE_DELAY_MS,
  HOVER_OPEN_DELAY_MS,
} from "@/lib/shell/constants";

/**
 * The shell's interaction state machine, kept apart from the provider so the
 * context file stays a thin assembler. Owns which slot is *active*, debounced
 * hover intent (open/close delays so sweeping across handles doesn't cascade),
 * and *pinning* — keeping a slot open despite the pointer leaving because it
 * holds focus or was click-opened.
 *
 * `setActiveSlotId` is returned so the provider can force-close a slot that
 * unregisters while active.
 */
export function useSlotActivation() {
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const pinnedRef = useRef(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSlotRef = useRef<string | null>(null);

  useEffect(() => {
    activeSlotRef.current = activeSlotId;
  }, [activeSlotId]);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, [clearOpenTimer, clearCloseTimer]);

  // Hover intent (debounced): a handle/region must be hovered briefly before it
  // opens, and entering any slot region cancels a pending close.
  const hoverEnter = useCallback(
    (id: string) => {
      clearCloseTimer();
      if (activeSlotRef.current === id) {
        clearOpenTimer();
        return;
      }
      clearOpenTimer();
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null;
        pinnedRef.current = false;
        setActiveSlotId(id);
      }, HOVER_OPEN_DELAY_MS);
    },
    [clearOpenTimer, clearCloseTimer],
  );

  // Pointer left a slot region: cancel a pending open, and close after a grace
  // period unless the slot is pinned (focused / click-opened).
  const hoverLeave = useCallback(() => {
    clearOpenTimer();
    if (pinnedRef.current) {
      return;
    }
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setActiveSlotId(null);
    }, HOVER_CLOSE_DELAY_MS);
  }, [clearOpenTimer, clearCloseTimer]);

  // Keyboard focus opens immediately (no hover debounce).
  const focusOpen = useCallback(
    (id: string) => {
      clearOpenTimer();
      clearCloseTimer();
      setActiveSlotId(id);
    },
    [clearOpenTimer, clearCloseTimer],
  );

  const closeActive = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    pinnedRef.current = false;
    setActiveSlotId(null);
  }, [clearOpenTimer, clearCloseTimer]);

  // Click pins a slot open (or closes it if it's already the pinned slot).
  const toggleSlot = useCallback(
    (id: string) => {
      clearOpenTimer();
      clearCloseTimer();
      if (activeSlotRef.current === id && pinnedRef.current) {
        pinnedRef.current = false;
        setActiveSlotId(null);
        return;
      }
      pinnedRef.current = true;
      setActiveSlotId(id);
    },
    [clearOpenTimer, clearCloseTimer],
  );

  const pinActive = useCallback(() => {
    pinnedRef.current = true;
    clearCloseTimer();
  }, [clearCloseTimer]);

  const unpinActive = useCallback(() => {
    pinnedRef.current = false;
  }, []);

  return {
    activeSlotId,
    setActiveSlotId,
    hoverEnter,
    hoverLeave,
    focusOpen,
    toggleSlot,
    pinActive,
    unpinActive,
    closeActive,
  };
}
