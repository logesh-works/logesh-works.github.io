"use client";

import { Component, type ReactNode } from "react";

interface SafeBoundaryProps {
  children: ReactNode;
  /** Rendered instead of the children once they have thrown. */
  fallback?: ReactNode;
  onError?: (error: unknown) => void;
}

/**
 * Contains a failure to the part of the page that caused it, so an optional layer
 * (the 3D stage, the water cursor) failing to load or render never takes the
 * whole page down with it.
 */
export default class SafeBoundary extends Component<SafeBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("A page layer failed and was switched off.", error);
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
