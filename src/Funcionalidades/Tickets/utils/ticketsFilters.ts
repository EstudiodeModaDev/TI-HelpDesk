import type { GetAllOpts } from "../../../Models/Commons";

export function buildTicketsReportFilter(from: string, to: string,): GetAllOpts {
  const filters: string[] = [];

  filters.push(`fields/Created ge '${from}T00:00:00Z' and fields/Created le '${to}T23:59:59Z'`)

  return {
    filter: filters.join(" and "),
    top: 2000,
  };
}