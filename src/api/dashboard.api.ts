import { apiClient } from './client';

export interface DashboardSummary {
  total_transactions: number;
  success_transactions: number;
  failed_transactions: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface TransactionDataPoint {
  date: string;
  success: number;
  failed: number;
}

export interface DashboardParams {
  startDate: string;
  endDate: string;
  startMonth: string;
  endMonth: string;
  startYear: string;
  endYear: string;
  tenantId: number | null;
}

export const dashboardApi = {
  getSummaryChart: (params: DashboardParams) =>
    apiClient
      .post<DashboardSummary>('/transactions/get-chart-summary', { ...params })
      .then((r) => r.data),

  getRevenueChart: (params: DashboardParams) =>
    apiClient
      .post<RevenueDataPoint[]>('/dashboard/revenue', { ...params })
      .then((r) => r.data),

  getTransactionChart: (params: DashboardParams) =>
    apiClient
      .get<TransactionDataPoint[]>('/dashboard/transactions', { params })
      .then((r) => r.data),
};
