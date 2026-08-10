import { openDB, type DBSchema } from "idb";
import { DEFAULT_SETTINGS } from "./defaults";
import type { AppSettings, LicenseSnapshot, ServiceRecord } from "../types";

interface GeradorCheckDb extends DBSchema {
  services: {
    key: string;
    value: ServiceRecord;
    indexes: { "by-updated": string; "by-status": string };
  };
  settings: {
    key: "app";
    value: AppSettings;
  };
  meta: {
    key: string;
    value: unknown;
  };
}

const dbPromise = openDB<GeradorCheckDb>("geradorcheck-pro", 3, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("services")) {
      const services = db.createObjectStore("services", { keyPath: "id" });
      services.createIndex("by-updated", "updatedAt");
      services.createIndex("by-status", "status");
    }
    if (!db.objectStoreNames.contains("settings")) {
      db.createObjectStore("settings");
    }
    if (!db.objectStoreNames.contains("meta")) {
      db.createObjectStore("meta");
    }
  },
});

export async function saveService(service: ServiceRecord) {
  const next = { ...service, updatedAt: new Date().toISOString() };
  await (await dbPromise).put("services", next);
  return next;
}

export async function getService(id: string) {
  return (await dbPromise).get("services", id);
}

export async function listServices() {
  const items = await (
    await dbPromise
  ).getAllFromIndex("services", "by-updated");
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteService(id: string) {
  await (await dbPromise).delete("services", id);
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await (await dbPromise).get("settings", "app");
  return settings ?? { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: AppSettings) {
  await (await dbPromise).put("settings", settings, "app");
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await dbPromise).get("meta", key) as Promise<T | undefined>;
}

export async function setMeta(key: string, value: unknown) {
  await (await dbPromise).put("meta", value, key);
}

export async function getInstallationId() {
  const existing = await getMeta<string>("installationId");
  if (existing) return existing;
  const id = crypto.randomUUID();
  await setMeta("installationId", id);
  return id;
}

export async function cacheLicense(license: LicenseSnapshot) {
  await setMeta("licenseCache", {
    license,
    cachedAt: new Date().toISOString(),
  });
}

export async function readCachedLicense() {
  return getMeta<{ license: LicenseSnapshot; cachedAt: string }>(
    "licenseCache",
  );
}

export async function exportLocalData() {
  return JSON.stringify(
    {
      format: "geradorcheck-pro-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      services: await listServices(),
      settings: await getSettings(),
    },
    null,
    2,
  );
}

export async function importLocalData(text: string) {
  const parsed = JSON.parse(text) as {
    format?: string;
    services?: ServiceRecord[];
    settings?: AppSettings;
  };
  if (
    parsed.format !== "geradorcheck-pro-backup" ||
    !Array.isArray(parsed.services)
  ) {
    throw new Error("Arquivo de backup inválido.");
  }
  const db = await dbPromise;
  const tx = db.transaction(["services", "settings"], "readwrite");
  for (const service of parsed.services)
    await tx.objectStore("services").put(service);
  if (parsed.settings)
    await tx.objectStore("settings").put(parsed.settings, "app");
  await tx.done;
  return parsed.services.length;
}

export async function requestPersistentStorage() {
  if (navigator.storage?.persist) {
    return navigator.storage.persist();
  }
  return false;
}
