import type { PrestamosTabKey } from "./PretamosPage";

export type TabsItem = { key: PrestamosTabKey; label: string };

export type TabsProps = {
  value: PrestamosTabKey;
  items: TabsItem[];
  onChange?: (v: PrestamosTabKey) => void;
};

export function Tabs({ value, items, onChange }: TabsProps) {
  return (
    <div className="pl-tabs">
      {items.map((it) => (
        <button key={it.key} type="button" className={`pl-tab ${value === it.key ? "is-active" : ""}`} onClick={() => onChange?.(it.key)}>
          {it.label}
        </button>
      ))}
    </div>
  );
}
