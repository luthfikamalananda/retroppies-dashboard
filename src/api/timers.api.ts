import { apiClient, type BaseResponse } from './client';

export interface ResultRules {
  rules: Rule[];
  total: number;
}

export interface Rule {
  id: number;
  rulesType: string;
  value: number;
  tenantId: number;
  tenantName: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface RuleListParams {
  tenantId: number;
  keyword: string;
  page: number;
  limit: number;
}

export interface RulePayload {
  rulesType: string;
  value: number;
  tenantId: number;
}

export interface RulePayloadUpdate {
  rulesType: string;
  value: number;
}

export const timersApi = {
  get: (params: RuleListParams) =>
    apiClient.post<BaseResponse<ResultRules>>('/rules/get', { ...params }).then((r) => r.data),

  create: (payload: RulePayload) =>
    apiClient.post<BaseResponse<Rule>>('/rules/create', { ...payload }).then((r) => r.data),

  update: (id: number, payload: RulePayloadUpdate) =>
    apiClient.post<BaseResponse<Rule>>(`/rules/update`, { id, ...payload }).then((r) => r.data),

  delete: (id: number) =>
    apiClient.post<BaseResponse<any>>(`/rules/delete`, { id: id }).then((r) => r.data),
};
