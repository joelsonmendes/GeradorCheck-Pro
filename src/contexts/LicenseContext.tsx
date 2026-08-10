import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { apiGet, apiPost } from "../lib/api";
import {
  cacheLicense,
  getInstallationId,
  readCachedLicense,
  requestPersistentStorage,
} from "../lib/local-db";
import { getPlatformLabel } from "../lib/format";
import type { ActivationRequest, LicenseSnapshot } from "../types";

interface LicenseContextValue {
  license: LicenseSnapshot | null;
  loading: boolean;
  offline: boolean;
  error: string | null;
  refresh: () => Promise<LicenseSnapshot | null>;
  registerCompletion: (serviceId: string) => Promise<LicenseSnapshot>;
  requestActivation: () => Promise<ActivationRequest>;
}

const LicenseContext = createContext<LicenseContextValue | undefined>(
  undefined,
);

const ACTIVE_OFFLINE_DAYS = 37;

export function LicenseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [license, setLicense] = useState<LicenseSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyLicense = useCallback(async (next: LicenseSnapshot) => {
    setLicense(next);
    setOffline(false);
    setError(null);
    await cacheLicense(next);
    return next;
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setLicense(null);
      return null;
    }
    setLoading(true);
    try {
      const installationId = await getInstallationId();
      const next = await apiPost<LicenseSnapshot>("/device/register", {
        installationId,
        label: `${getPlatformLabel()} — GeradorCheck`,
        platform: getPlatformLabel(),
      });
      await requestPersistentStorage();
      return await applyLicense(next);
    } catch (cause) {
      const cached = await readCachedLicense();
      if (cached?.license.status === "active") {
        const age = Date.now() - new Date(cached.cachedAt).getTime();
        if (age <= ACTIVE_OFFLINE_DAYS * 86_400_000) {
          setLicense(cached.license);
          setOffline(true);
          setError(
            "Modo offline: a licença será validada quando a conexão retornar.",
          );
          return cached.license;
        }
      }
      const message =
        cause instanceof Error
          ? cause.message
          : "Não foi possível validar a licença.";
      setError(message);
      setLicense(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [applyLicense, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const online = () => void refresh();
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, [refresh]);

  const value = useMemo<LicenseContextValue>(
    () => ({
      license,
      loading,
      offline,
      error,
      refresh,
      async registerCompletion(serviceId) {
        const installationId = await getInstallationId();
        const next = await apiPost<LicenseSnapshot>("/trial/complete", {
          serviceId,
          installationId,
        });
        return applyLicense(next);
      },
      async requestActivation() {
        const installationId = await getInstallationId();
        return apiPost<ActivationRequest>("/activation/request", {
          installationId,
        });
      },
    }),
    [applyLicense, error, license, loading, offline, refresh],
  );

  return (
    <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>
  );
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context)
    throw new Error("useLicense deve ser usado dentro de LicenseProvider.");
  return context;
}
