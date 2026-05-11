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
  date_start: string;
  date_end: string;
  outlet_id?: string;
}

export const dashboardApi = {
  getSummary: (params: DashboardParams) =>
    apiClient
      .get<DashboardSummary>('/dashboard/summary', { params })
      .then((r) => r.data),

  getRevenueChart: (params: DashboardParams) =>
    apiClient
      .get<RevenueDataPoint[]>('/dashboard/revenue', { params })
      .then((r) => r.data),

  getTransactionChart: (params: DashboardParams) =>
    apiClient
      .get<TransactionDataPoint[]>('/dashboard/transactions', { params })
      .then((r) => r.data),
};
