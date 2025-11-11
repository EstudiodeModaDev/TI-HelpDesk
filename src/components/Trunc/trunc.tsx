type Props = {text?: string | null; lines?: number; className?: string};

export default function Trunc({ text, lines = 1, className = ""}: Props) {
  const safe = (text ?? "—").toString();
  return (
    <span className={`ttip trunc ${className}`} data-full={safe} style={{ ["--lines" as any]: String(lines) }} aria-label={safe}>
      {safe.slice(0,17)}...
    </span>
  );
}
