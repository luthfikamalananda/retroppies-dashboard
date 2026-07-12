import { apiClient, type BaseResponse } from './client';

// ─── Chart response shapes (see api-chart.md) ────────────────────────────────
export interface DailyItem {
  date: string;
  total: number;
}

export interface MonthlyItem {
  monthYear: string; // "YYYY-MM" or "No data"
  total: number;
}

export interface AnnualItem {
  year: string;
  total: number;
}

export interface ChartResult {
  daily: DailyItem[];
  monthly: MonthlyItem[];
  annual: AnnualItem[];
}

export interface ChartParams {
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  startMonth: string;  // MM
  endMonth: string;    // MM
  startYear: string;   // YYYY
  endYear: string;     // YYYY
  tenantId: number;    // 0 = all tenants
  productCode?: string;
  productType?: string;
  status?: string;     // SUCCESS | PENDING | FAILED | "" (all)
}

// Drop the "No data" sentinel item the backend returns for empty monthly ranges.
function cleanResult(result: ChartResult): ChartResult {
  return {
    daily: result.daily ?? [],
    monthly: (result.monthly ?? []).filter((m) => m.monthYear !== 'No data'),
    annual: result.annual ?? [],
  };
}

const defaults = { productCode: '', productType: '', status: '' };

export const dashboardApi = {
  // Grand total revenue (Rupiah) bucketed daily/monthly/annual.
  getChartSummary: (params: ChartParams) =>
    apiClient
      .post<BaseResponse<ChartResult>>('/transactions/get-chart-summary', {
        ...defaults,
        ...params,
      })
      .then((r) => cleanResult(r.data.result)),

  // Transaction count bucketed daily/monthly/annual.
  getChartCount: (params: ChartParams) =>
    apiClient
      .post<BaseResponse<ChartResult>>('/transactions/get-chart-count', {
        ...defaults,
        ...params,
      })
      .then((r) => cleanResult(r.data.result)),
};
