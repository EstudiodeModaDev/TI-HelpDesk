export type KpiProps = {
  label: string;
  value: number | string;
  className?: string;
};

export function Kpi({ label, value,}: KpiProps) {
  return (
    <div className={`pl-kpi`}>
      <div className="pl-kpiLabel">{label}</div>
      <div className="pl-kpiValue">{value}</div>
    </div>
  );
}
