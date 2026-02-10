import React from "react";

export type PillTone = "ok" | "warn" | "bad" | "neutral";

export type PillProps = {
  tone: PillTone;
  children: React.ReactNode;
  className?: string;
};

export function Pill({ tone, children, className = "" }: PillProps) {
  return (
    <span className={`pl-pill ${tone} ${className}`}>
      {children}
    </span>
  );
}
