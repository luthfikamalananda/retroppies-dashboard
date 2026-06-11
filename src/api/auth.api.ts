import { apiClient, type BaseResponse } from './client';

export interface LoginPayload {
    username: string;
    password: string;
}

export interface ResultLogin {
    token: string
    userId: number
    username: string
    roleId: number
    permissions: string[]
    tenantId: number
    isSuperadmin: boolean
    roleName: any
    tenantName: any
}

export interface PayloadChangePassword {
    oldPassword: string;
    newPassword: string;
}

export const authApi = {
    login: (payload: LoginPayload) =>
        apiClient.post<BaseResponse<ResultLogin>>('/users/login', payload, {
            headers: {
                Authorization: `Basic ${btoa(`photobox:PhotoBox123@`)}`,
            }
        }).then((r) => r.data),

    refresh: () =>
        apiClient.post<BaseResponse<ResultLogin>>('/auth/refresh').then((r) => r.data),

    logout: () => apiClient.post('/auth/logout'),

    changePassword: (payload: PayloadChangePassword) =>
        apiClient.post<BaseResponse<null>>('/users/change-password', { ...payload }).then((r) => r.data),
};
