import { describe, expect, it } from "vitest";
import { CHECKLIST_TEMPLATE, createChecklist } from "../constants/checklist";
import { createEmptyService } from "./defaults";

describe("modelo de ordem de serviço", () => {
  it("cria os 19 pontos técnicos sem identificadores repetidos", () => {
    const checklist = createChecklist();
    expect(checklist).toHaveLength(19);
    expect(new Set(checklist.map((item) => item.id)).size).toBe(19);
    expect(checklist.every((item) => item.status === "pending")).toBe(true);
    expect(CHECKLIST_TEMPLATE.some((item) => item.id === "qta")).toBe(true);
  });

  it("inicia a OS como rascunho sem consumir o teste", () => {
    const service = createEmptyService("Técnico de Teste");
    expect(service.status).toBe("draft");
    expect(service.trialCompletionRegistered).toBe(false);
    expect(service.service.technician).toBe("Técnico de Teste");
    expect(service.orderNumber).toMatch(/^OS-\d{8}-\d{4}$/);
  });
});
