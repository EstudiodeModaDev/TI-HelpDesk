import React from "react";

export type CardProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Card({ title, subtitle, right, children, className = "" }: CardProps) {
  return (
    <section className={`pl-card ${className}`}>
      <div className="pl-cardHead">
        <div>
          <div className="pl-cardTitle">{title}</div>
          {subtitle ? <div className="pl-cardSub">{subtitle}</div> : null}
        </div>

        {right ? <div className="pl-cardRight">{right}</div> : null}
      </div>

      <div className="pl-cardBody">{children}</div>
    </section>
  );
}
