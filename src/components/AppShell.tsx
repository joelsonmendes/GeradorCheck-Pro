import {
  Activity,
  CircleUserRound,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Brand } from "./Brand";
import { useAuth } from "../contexts/AuthContext";
import { useLicense } from "../contexts/LicenseContext";
import { StatusBadge } from "./ui";

export function AppShell() {
  const { user, logout } = useAuth();
  const { license, offline, error } = useLicense();
  const nav: {
    to: string;
    label: string;
    icon: React.ReactNode;
    end?: boolean;
  }[] = [
    {
      to: "/app",
      label: "Painel",
      icon: <LayoutDashboard size={20} />,
      end: true,
    },
    { to: "/app/nova-os", label: "Nova OS", icon: <FilePlus2 size={20} /> },
    {
      to: "/app/configuracoes",
      label: "Configurações",
      icon: <Settings size={20} />,
    },
  ];
  if (license?.isAdmin)
    nav.push({
      to: "/admin",
      label: "Licenças",
      icon: <ShieldCheck size={20} />,
    });

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Brand />
        <nav>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="app-sidebar__license">
          <Activity size={18} />
          <div>
            <small>Licenciamento</small>
            {license ? (
              <StatusBadge status={license.status} />
            ) : (
              <span>Validando…</span>
            )}
          </div>
        </div>
        <button className="app-sidebar__user" onClick={() => void logout()}>
          <CircleUserRound size={24} />
          <span>
            <b>{user?.displayName || "Usuário"}</b>
            <small>{user?.email}</small>
          </span>
          <LogOut size={18} />
        </button>
      </aside>
      <main className="app-main">
        {(offline || error) && (
          <div
            className={`system-banner ${offline ? "system-banner--warning" : "system-banner--danger"}`}
          >
            {error}
          </div>
        )}
        <Outlet />
      </main>
      <nav className="mobile-nav">
        {nav.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
