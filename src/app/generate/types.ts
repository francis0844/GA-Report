export type MetricChange = {
  metric: string;
  current: number;
  comparison: number;
  absChange: number;
  pctChange: number;
};

export type ComparisonResult = {
  metrics: MetricChange[];
  currentRange: { start: string; end: string };
  comparisonRange: { start: string; end: string };
  reportId?: string;
};

export type GenerateActionResponse =
  | { success: false; error: string }
  | { success: true; data: ComparisonResult };
