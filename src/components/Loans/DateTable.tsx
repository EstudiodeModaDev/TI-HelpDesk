import React from "react";

export type DataTableProps = {
  columns: string[];
  rows: React.ReactNode; 
  className?: string;
};

export function DataTable({ columns, rows, className = "" }: DataTableProps) {
  return (
    <div className={`pl-tableWrap ${className}`}>
      <table className="pl-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
