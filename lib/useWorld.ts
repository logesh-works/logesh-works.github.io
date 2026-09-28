"use client";

import { useEffect, useReducer } from "react";

import { on, world, type WorldEvent } from "./world";

/** Re-render the calling component whenever one of the given world events fires. */
export const useWorld = (...events: WorldEvent[]) => {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const key = events.join(",");
  useEffect(() => {
    const offs = key.split(",").map((e) => on(e as WorldEvent, bump));
    return () => offs.forEach((off) => off());
  }, [key]);
  return world;
};
