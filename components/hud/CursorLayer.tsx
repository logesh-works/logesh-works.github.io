"use client";

import dynamic from "next/dynamic";

import SafeBoundary from "@/components/site/SafeBoundary";

/** The water cursor, loaded on its own after the page (it pulls in three.js). */
const WaterCursor = dynamic(() => import("./WaterCursor"), { ssr: false });

/** If its code can't be fetched, the page simply goes without it. */
const CursorLayer = () => (
  <SafeBoundary>
    <WaterCursor />
  </SafeBoundary>
);

export default CursorLayer;
