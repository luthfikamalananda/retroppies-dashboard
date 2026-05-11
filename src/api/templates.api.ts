import { apiClient, type BaseResponse } from './client';

export interface ResultTemplate {
    templates: {
        id: number;
        displayUrl: string;
        productionUrl: string;
        tenantId: number;
        layoutId: number;
        CreatedAt: string;
        CreatedBy: string;
        UpdatedAt: string;
        UpdatedBy: string;
    }[];
}

export interface RequestTemplateList {
    page: number,
    tenantId: number,
    limit: number
}

export const templatesApi = {
    list: (request: RequestTemplateList) =>
        apiClient.post<BaseResponse<ResultTemplate>>('/template/get', request).then((r) => r.data),
    upload: (file: File, onProgress?: (pct: number) => void) => {
        const form = new FormData();
        form.append('image', file);
        return apiClient
            .post<BaseResponse<ResultTemplate>>('/templates', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (onProgress && e.total) {
                        onProgress(Math.round((e.loaded * 100) / e.total));
                    }
                },
            })
            .then((r) => r.data);
    },

    delete: (id: string) => apiClient.delete(`/templates/${id}`),

    setStatus: (id: string, status: 'active' | 'inactive') =>
        apiClient.patch(`/templates/${id}/status`, { status }),
};
