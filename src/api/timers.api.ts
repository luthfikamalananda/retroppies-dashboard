import { apiClient } from './client';

export interface TimerSettings {
  payment_timer: number;     // seconds
  photo_session_timer: number; // seconds
  reference_datetime?: string; // read-only from backend
}

export const timersApi = {
  get: () =>
    apiClient.get<TimerSettings>('/timers').then((r) => r.data),

  update: (payload: Pick<TimerSettings, 'payment_timer' | 'photo_session_timer'>) =>
    apiClient.put<TimerSettings>('/timers', payload).then((r) => r.data),
};
