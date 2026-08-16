"use client";

import { useCallback, useEffect, useRef } from "react";

export function useScrollShadow() {
  const ref = useRef<HTMLDivElement | null>(null);
  const frame = useRef(0);

  const sync = useCallback((node: HTMLDivElement) => {
    node.dataset.scrolledX = node.scrollLeft > 0 ? "true" : "false";
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    sync(node);

    const onScroll = () => {
      if (frame.current) return;
      frame.current = window.requestAnimationFrame(() => {
        frame.current = 0;
        sync(node);
      });
    };

    node.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      node.removeEventListener("scroll", onScroll);
      if (frame.current) window.cancelAnimationFrame(frame.current);
    };
  }, [sync]);

  return ref;
}
