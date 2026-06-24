import { apiClient, type BaseResponse } from './client';

export interface Session {
    id: number;
    sessionCode: string;
    invoiceNumber: string;
    tenantId: number;
    tenantName: string;
    isPublish: boolean;
    resultUrl: string;
    createdAt: string;
}

export interface ResultSessions {
    list: Session[];
    total: number;
}

export interface SessionListParams {
    tenantId: number | null;
    keyword: string;
    page: number;
    limit: number;
    isPublish: boolean | null;
}

export const sessionsApi = {
    list: (params: SessionListParams) =>
        apiClient
            .post<BaseResponse<ResultSessions>>(
                'photobooth/sessions/list',
                params,
            )
            .then((r) => r.data),
};