import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLicense } from "../contexts/LicenseContext";

export function AuthGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="page-loader">
        <span className="loader" />
        <p>Carregando acesso seguro…</p>
      </div>
    );
  if (!user)
    return (
      <Navigate to="/entrar" replace state={{ from: location.pathname }} />
    );
  return <Outlet />;
}

export function DeviceGuard() {
  const { license, loading } = useLicense();
  const location = useLocation();
  if (loading)
    return (
      <div className="page-loader">
        <span className="loader" />
        <p>Validando sua licença…</p>
      </div>
    );
  if (location.pathname === "/ativar") return <Outlet />;
  if (license && !license.currentDeviceAllowed)
    return <Navigate to="/ativar?motivo=dispositivo" replace />;
  if (license?.status === "suspended" || license?.status === "revoked")
    return <Navigate to="/ativar?motivo=licenca" replace />;
  return <Outlet />;
}

export function AdminGuard() {
  const { license, loading } = useLicense();
  if (loading)
    return (
      <div className="page-loader">
        <span className="loader" />
        <p>Validando acesso administrativo…</p>
      </div>
    );
  return license?.isAdmin ? <Outlet /> : <Navigate to="/app" replace />;
}
