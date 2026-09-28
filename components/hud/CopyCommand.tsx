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
    <div className="flex items-center justify-between gap-3 rounded-full bg-black/40 py-1.5 pl-5 pr-1.5 font-mono text-[0.8rem] backdrop-blur-md">
      <code>
        <span aria-hidden className="text-signal">$ </span>
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        className="t-label rounded-full px-3 py-2 text-fg/60 transition-colors hover:bg-raised hover:text-signal"
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
