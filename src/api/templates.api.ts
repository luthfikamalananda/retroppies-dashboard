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
    limit: number,
    layoutId?: number,
}

export const templatesApi = {
    list: (request: RequestTemplateList) =>
        apiClient.post<BaseResponse<ResultTemplate>>('/template/get', request).then((r) => r.data),
    upload: (tenantId: number, layoutId: number, file: File, onProgress?: (pct: number) => void) => {
        const form = new FormData();
        form.append('display', file);
        form.append('production', file);
        form.append('layout_id', layoutId.toString());
        form.append('tenant_id', tenantId.toString());
        return apiClient
            .post<BaseResponse<ResultTemplate>>('/template/create', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (onProgress && e.total) {
                        onProgress(Math.round((e.loaded * 100) / e.total));
                    }
                },
            })
            .then((r) => r.data);
    },

    update: (id: number, tenantId: number, layoutId: number, file: File, onProgress?: (pct: number) => void) => {
        const form = new FormData();
        form.append('display', file);
        form.append('production', file);
        form.append('layout_id', layoutId.toString());
        form.append('tenant_id', tenantId.toString());
        return apiClient
            .put<BaseResponse<ResultTemplate>>(`/template/update/${id}`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (onProgress && e.total) {
                        onProgress(Math.round((e.loaded * 100) / e.total));
                    }
                },
            })
            .then((r) => r.data);
    },

    delete: (id: number) => apiClient.post<BaseResponse<any>>(`/template/delete`, { id: id }).then((r) => r.data),
};
