import { apiClient, type BaseResponse } from './client';

export interface ResultPermissions {
    id: number;
    name: string;
}


export interface PayloadAssignPermission {
    roleId: number;
    permissionIds: number[];
}

export interface ResultRolePermission {
    roleId: number,
    roleName: string,
    permissions: ResultPermissions[]
}

export const permissionsApi = {
    list: () =>
        apiClient.get<BaseResponse<ResultPermissions[]>>('/permissions/get').then((r) => r.data),

    getByRole: (roleId: number) =>
        apiClient.post<BaseResponse<ResultRolePermission>>('/role-permissions/get', { roleId }).then((r) => r.data),

    assign: (payload: PayloadAssignPermission) =>
        apiClient.post<BaseResponse<any>>('/role-permissions/replace', payload).then((r) => r.data),
};
