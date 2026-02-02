export type DriveSizeResult = {
  driveId: string;
  name: string;
  webUrl?: string;
  totalBytes: number;
  filesCount: number;
  lastCalculatedAt: string; // ISO
};

export type ListSizeEstimate = {
  listId: string;
  name: string;
  webUrl?: string;

  itemsCount: number;

  sampleCount: number;
  avgFieldsBytes: number;          // estimado (JSON UTF-8)
  p95FieldsBytes: number;          // para ver outliers (opcional pero útil)
  estimatedFieldsTotalBytes: number;

  lastCalculatedAt: string;
};
