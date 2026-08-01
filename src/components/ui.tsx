import { cn } from "@/lib/utils";
import React from "react";

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-surface shadow-[var(--shadow)]", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "accent" | "good" | "warn" | "danger";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-2 text-muted",
    accent: "bg-accent-soft text-accent-strong",
    good: "bg-good-soft text-good",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  const variants: Record<string, string> = {
    primary: "bg-accent text-white hover:bg-accent-strong",
    secondary: "bg-surface-2 text-foreground hover:bg-border",
    ghost: "text-foreground hover:bg-surface-2",
    outline: "border border-border text-foreground hover:bg-surface-2",
  };
  const sizes: Record<string, string> = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    />
  );
}

export function ProgressBar({ percent, tone = "accent" }: { percent: number; tone?: "accent" | "warn" | "danger" | "good" }) {
  const clamped = Math.max(0, Math.min(150, percent));
  const colors: Record<string, string> = {
    accent: "bg-accent",
    warn: "bg-warn",
    danger: "bg-danger",
    good: "bg-good",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className={cn("h-full rounded-full transition-all", colors[tone])}
        style={{ width: `${Math.min(100, clamped)}%` }}
      />
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 space-y-1.5">
      {eyebrow && <div className="text-xs font-semibold uppercase tracking-wide text-accent">{eyebrow}</div>}
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      {description && <p className="max-w-3xl text-sm text-muted">{description}</p>}
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2.5">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="text-sm font-bold">{value}</div>
      {hint && <div className="text-[10px] text-muted">{hint}</div>}
    </div>
  );
}
