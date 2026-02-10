import React from "react";

export type BadgeTone = "ok" | "warn" | "bad" | "neutral";

export type BadgeProps = {
  tone: BadgeTone;
  children: React.ReactNode;
  className?: string;
};

export function Badge({ tone, children, className = "" }: BadgeProps) {
  return (
    <span className={`pl-badge ${tone} ${className}`}>
      {children}
    </span>
  );
}
