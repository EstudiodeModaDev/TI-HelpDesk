type Props = {text?: string | null; lines?: number; className?: string; maxLenght?: number};

export default function Trunc({ text, lines = 1, className = "", maxLenght = 12}: Props) {
  const safe = (text ?? "—").toString();
  return (
    <span className={`ttip trunc ${className}`} data-full={safe} style={{ ["--lines" as any]: String(lines) }} aria-label={safe}>
      {safe.length <= maxLenght ? safe : safe.slice(0, maxLenght) + "..."}
    </span>
  );
}
