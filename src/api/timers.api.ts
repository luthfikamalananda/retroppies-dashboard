import { apiClient, type BaseResponse } from './client';

export interface ResultRules {
  rules: Rule[];
  total: number;
}

export interface Rule {
  id: number;
  rulesType: string;
  value: number;
  tenant_id: number;
  CreatedAt: string;
  CreatedBy: string;
  UpdatedAt: string;
  UpdatedBy: string;
}

export interface RuleListParams {
  tenant_id: number;
  keyword: string;
  page: number;
  limit: number;
}

export interface RulePayload {
  rulesType: string;
  value: number;
  tenant_id: number;
}

export const timersApi = {
  get: (params: RuleListParams) =>
    apiClient.post<BaseResponse<ResultRules>>('/rules/get', { ...params }).then((r) => r.data),

  create: (payload: RulePayload) =>
    apiClient.post<BaseResponse<Rule>>('/rules', payload).then((r) => r.data),

  update: (id: number, payload: Omit<RulePayload, 'tenant_id'>) =>
    apiClient.put<BaseResponse<Rule>>(`/rules/${id}`, payload).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<BaseResponse<null>>(`/rules/${id}`).then((r) => r.data),
};
