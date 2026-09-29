"use client";

import { type RefObject, useEffect, useState } from "react";

export interface MeasuredSize {
  width: number;
  height: number;
}

/** Tracks an element's real content box size via ResizeObserver. */
export function useMeasuredSize(ref: RefObject<HTMLElement | null>): MeasuredSize {
  const [size, setSize] = useState<MeasuredSize>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return size;
}
