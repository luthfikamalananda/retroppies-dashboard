import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

export interface BaseResponse<T> {
    statusCode: number;
    success: boolean;
    responseDatetime: string;
    result: T;
    message: string;
}


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// ─── Request interceptor: attach access token ────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().user?.token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── 401 / token expired → force logout ──────────────────────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().clearUser();
            // Beri tahu App.tsx untuk clear query cache + tampilkan notifikasi
            window.dispatchEvent(
                new CustomEvent('auth:logout', {
                    detail: { message: 'Sesi Anda telah berakhir. Silakan login kembali.' },
                })
            );
        }
        return Promise.reject(error);
    }
);

// ─── Convenience helpers ─────────────────────────────────────────────────────
export function extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        return (
            error.response?.data?.message ??
            error.response?.data?.error ??
            error.message
        );
    }
    return 'Terjadi kesalahan. Silakan coba lagi.';
}
