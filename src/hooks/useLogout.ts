// Single place to use the logout action everywhere.
// Clears auth store + query cache, then redirects.
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useScopeStore } from '../stores/scopeStore';
import { authApi } from '../api/auth.api';

export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearScope = useScopeStore((s) => s.clearScope);
  const navigate = useNavigate();

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Continue logout even if the API call fails.
    }
    clearAuth();
    clearScope();
    queryClient.clear();
    navigate('/login', { replace: true });
  }

  return { logout };
}
