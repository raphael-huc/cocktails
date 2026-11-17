import { useEffect } from "react";

/**
 * Keeps the screen on while the component is displayed, so the device does not
 * go to sleep in the middle of a recipe. Does nothing where the browser has no
 * support for it or refuses (low battery, for instance).
 */
export function useWakeLock() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let released = false;

    async function acquire() {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (released) void lock.release();
      } catch {
        // Refused by the browser: the recipe still works, the screen may dim.
      }
    }

    // The lock is dropped whenever the page is hidden: take it again on return.
    function onVisibilityChange() {
      if (document.visibilityState === "visible") void acquire();
    }

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void lock?.release();
    };
  }, []);
}
