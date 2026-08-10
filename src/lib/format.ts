export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date =
    value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("pt-BR").format(date);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

export function currencyFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function getPlatformLabel() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad")) return "iOS/iPadOS";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac")) return "macOS";
  return "Navegador web";
}
