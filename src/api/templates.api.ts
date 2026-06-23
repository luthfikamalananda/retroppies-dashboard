import { apiClient, type BaseResponse } from './client';

export interface ResultTemplate {
    templates: {
        id: number;
        displayUrl: string;
        productionUrl: string;
        tenantId: number;
        layoutId: number;
        isDefault: boolean;
        CreatedAt: string;
        CreatedBy: string;
        UpdatedAt: string;
        UpdatedBy: string;
    }[];
}

export interface RequestTemplateList {
    page: number,
    tenantId: number | null,
    limit: number,
    layoutId?: number,
}

export const templatesApi = {
    list: (request: RequestTemplateList) =>
        apiClient.post<BaseResponse<ResultTemplate>>('/template/get', request).then((r) => r.data),
    upload: (tenantId: number | null, layoutId: number, displayFile: File | null, productionFile: File | null, isDefault: boolean, onProgress?: (pct: number) => void) => {
        const form = new FormData();
        if (displayFile !== null) form.append('display', displayFile);
        if (productionFile !== null) form.append('production', productionFile);
        form.append('layout_id', layoutId.toString());
        form.append('tenant_id', String(tenantId ?? ''));
        form.append('isDefault', String(isDefault));
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

    update: (id: number, tenantId: number | null, layoutId: number, displayFile: File | null, productionFile: File | null, isDefault: boolean, onProgress?: (pct: number) => void) => {
        const form = new FormData();
        if (displayFile !== null) form.append('display', displayFile);
        if (productionFile !== null) form.append('production', productionFile);
        form.append('id', id.toString());
        form.append('layout_id', layoutId.toString());
        form.append('tenant_id', String(tenantId ?? ''));
        form.append('is_default', String(isDefault));
        return apiClient
            .post<BaseResponse<ResultTemplate>>(`/template/update`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (onProgress && e.total) {
                        onProgress(Math.round((e.loaded * 100) / e.total));
                    }
                },
            })
            .then((r) => r.data);
    },

    delete: (id: number) => apiClient.post<BaseResponse<unknown>>(`/template/delete`, { id: id }).then((r) => r.data),
};
