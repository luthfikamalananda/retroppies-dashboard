import { apiClient, type BaseResponse } from './client';

export interface Layout {
    id: number;
    name: string;
    thumbnailUrl: string;
    tenantId: number;
    CreatedAt: string;
    CreatedBy: string;
    UpdatedAt: string;
    UpdatedBy: string;
}

export interface ResultLayoutList {
    id: number;
}

// export interface RequestLayoutList {
//     page: number;
//     tenantId: number;
//     limit: number;
// }

export const layoutsApi = {
    list: () =>
        apiClient.get<BaseResponse<ResultLayoutList[]>>('/layout/get').then((r) => r.data),
};
