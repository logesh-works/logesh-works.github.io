"use client";

import { useState } from "react";

const CopyCommand = ({ command }: { command: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line/10 bg-ink px-4 py-3 font-mono text-sm">
      <code>
        <span aria-hidden className="text-signal">$ </span>
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-raised hover:text-fg"
      >
        {copied ? "Copied" : "Copy"}
        <span className="sr-only"> install command</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </div>
  );
};

export default CopyCommand;
