"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearTokens,
  getAccessToken,
  getStoredUser,
  setTokens,
  type StoredUser,
} from "@/lib/api-client";
import { getWorkerMe, logoutWorker, workerLogin } from "../api/auth-api";
import { useRouter } from "@/i18n/navigation";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = useCallback(async () => {
    const token = getAccessToken();
    const stored = getStoredUser();

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (stored) {
      setUser(stored);
    }

    try {
      const liveUser = await getWorkerMe();
      if (liveUser) {
        setUser(liveUser);
      }
    } catch {
      // If fetching me fails (and refresh fails), user state stays as stored or null
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = useCallback(
    async (phone: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await workerLogin(phone, password);
        setTokens(response.accessToken, response.refreshToken, response.user);
        setUser(response.user);
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutWorker();
    } finally {
      clearTokens();
      setUser(null);
      setIsLoading(false);
      router.push("/worker/sign-in");
    }
  }, [router]);

  return {
    user,
    isAuthenticated: Boolean(user && getAccessToken()),
    isWorker: user?.role === "WORKER",
    isLoading,
    login,
    logout,
  };
}
