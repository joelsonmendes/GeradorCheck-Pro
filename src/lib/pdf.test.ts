import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, createEmptyService } from "./defaults";
import { createServicePdf } from "./pdf";
import type { LicenseSnapshot } from "../types";

describe("relatório PDF", () => {
  it("gera um documento paginado com identificação da licença", () => {
    const service = createEmptyService("Carlos Técnico");
    service.customer.name = "Cliente Exemplo";
    service.equipment.manufacturer = "Cummins";
    service.equipment.model = "C90D6";
    service.servicesPerformed =
      "Inspeção preventiva, testes operacionais e reaperto de conexões.";
    service.conclusion = "Equipamento liberado para operação.";
    const license: LicenseSnapshot = {
      uid: "user-test",
      status: "active",
      licenseCode: "GCP-TEST-0001",
      entitlementVersion: "1",
      perpetual: true,
      ownerName: "Carlos Técnico",
      ownerCompany: "Carlos Geradores",
      trialUsed: 3,
      trialLimit: 3,
      trialRemaining: 0,
      maxDevices: 1,
      currentDeviceAllowed: true,
      currentDeviceId: "TESTDEVICE",
      devices: [],
      activatedAt: new Date().toISOString(),
      lastValidatedAt: new Date().toISOString(),
      isAdmin: false,
    };
    const result = createServicePdf(
      service,
      { ...DEFAULT_SETTINGS, businessName: "Carlos Geradores" },
      license,
    );
    expect(result.filename).toContain("Cliente-Exemplo.pdf");
    expect(result.doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    expect(result.blob.size).toBeGreaterThan(10_000);
  });
});
