/**
 * DUMMY AUTH MODE
 * ---------------
 * Set DUMMY_MODE = true  → login pakai akun dummy di bawah, tanpa API.
 * Set DUMMY_MODE = false → login pakai API sungguhan (mode produksi).
 *
 * Untuk revert ke API: ubah DUMMY_MODE ke false, selesai.
 */
export const DUMMY_MODE = import.meta.env.VITE_DUMMY_MODE === 'true';

import type { ResultLogin as LoginResponse } from '../api/auth.api';
import type { BaseResponse } from '../api/client';

interface DummyUser {
    email: string;
    password: string;
    response: LoginResponse;
}

export const DUMMY_USERS: DummyUser[] = [
    {
        email: 'admin@retroppies.com',
        password: 'admin123',
        response: {
            token: 'dummy-token-admin',
            userId: 1,
            username: 'Admin TA',
            roleId: 1,
            permissions: [
                'dashboard:read',
                'products:read', 'products:write',
                'templates:read', 'templates:write',
                'timers:read', 'timers:write',
                'vouchers:read', 'vouchers:write',
                'transactions:read',
                'accounts:read', 'accounts:write',
            ],
            tenantId: 1,
            isSuperadmin: true,
        },
    },
    {
        email: 'manager@retroppies.com',
        password: 'manager123',
        response: {
            token: 'dummy-token-manager',
            userId: 2,
            username: 'Manager Outlet A',
            roleId: 2,
            permissions: [
                'dashboard:read',
                'vouchers:read',
                'transactions:read',
            ],
            tenantId: 1,
            isSuperadmin: false,
        },
    },
];

/** Simulasi login dummy — resolve jika kredensial cocok, reject jika tidak. */
export function dummyLogin(email: string, password: string) {
    return new Promise<BaseResponse<LoginResponse>>((resolve, reject) => {
        setTimeout(() => {
            const match = DUMMY_USERS.find(
                (u) => u.email === email && u.password === password,
            );
            if (match) {
                resolve({
                    statusCode: 200,
                    success: true,
                    responseDatetime: new Date().toISOString(),
                    result: match.response,
                    message: 'Login successful',
                });
            } else {
                reject(new Error('Email atau password salah.'));
            }
        }, 500); // simulasi network delay
    });
}
