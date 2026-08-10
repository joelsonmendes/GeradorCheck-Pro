import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AdminGuard, AuthGuard, DeviceGuard } from "./components/RouteGuards";
import { LicenseProvider } from "./contexts/LicenseContext";

const LandingPage = lazy(() =>
  import("./pages/LandingPage").then((module) => ({
    default: module.LandingPage,
  })),
);
const DemoPage = lazy(() =>
  import("./pages/DemoPage").then((module) => ({ default: module.DemoPage })),
);
const LoginPage = lazy(() =>
  import("./pages/AuthPages").then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("./pages/AuthPages").then((module) => ({
    default: module.RegisterPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/AuthPages").then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
const LegalPage = lazy(() =>
  import("./pages/LegalPage").then((module) => ({ default: module.LegalPage })),
);
const ActivationPage = lazy(() =>
  import("./pages/ActivationPage").then((module) => ({
    default: module.ActivationPage,
  })),
);
const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((module) => ({ default: module.AdminPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const ServiceEditorPage = lazy(() =>
  import("./pages/ServiceEditorPage").then((module) => ({
    default: module.ServiceEditorPage,
  })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);

export function App() {
  return (
    <Suspense
      fallback={
        <div className="page-loader">
          <span className="loader" />
          <p>Carregando GeradorCheck Pro…</p>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/demonstracao" element={<DemoPage />} />
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/criar-conta" element={<RegisterPage />} />
        <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
        <Route path="/termos" element={<LegalPage kind="terms" />} />
        <Route path="/privacidade" element={<LegalPage kind="privacy" />} />

        <Route element={<AuthGuard />}>
          <Route
            element={
              <LicenseProvider>
                <DeviceGuard />
              </LicenseProvider>
            }
          >
            <Route path="/ativar" element={<ActivationPage />} />
            <Route element={<AppShell />}>
              <Route path="/app" element={<DashboardPage />} />
              <Route path="/app/nova-os" element={<ServiceEditorPage />} />
              <Route
                path="/app/os/:serviceId"
                element={<ServiceEditorPage />}
              />
              <Route path="/app/configuracoes" element={<SettingsPage />} />
            </Route>
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
