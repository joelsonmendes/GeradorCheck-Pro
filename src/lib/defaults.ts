import { createChecklist } from "../constants/checklist";
import type { AppSettings, ServiceRecord } from "../types";

function dateValue() {
  return new Date().toISOString().slice(0, 10);
}

function timeValue() {
  return new Date().toTimeString().slice(0, 5);
}

export function makeOrderNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `OS-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function createEmptyService(technician = ""): ServiceRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    orderNumber: makeOrderNumber(),
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    status: "draft",
    trialCompletionRegistered: false,
    customer: {
      name: "",
      document: "",
      responsible: "",
      phone: "",
      email: "",
      address: "",
    },
    equipment: {
      manufacturer: "",
      model: "",
      serialNumber: "",
      powerKva: "",
      fuel: "Diesel",
      hourmeter: "",
      location: "",
      controller: "",
    },
    service: {
      type: "Manutenção preventiva",
      technician,
      startDate: dateValue(),
      startTime: timeValue(),
      endTime: "",
    },
    checklist: createChecklist(),
    measurements: {
      voltageL1L2: "",
      voltageL2L3: "",
      voltageL3L1: "",
      currentL1: "",
      currentL2: "",
      currentL3: "",
      frequency: "",
      batteryVoltage: "",
      coolantTemperature: "",
      oilPressure: "",
      rpm: "",
      loadPercent: "",
    },
    qta: {
      utilityAvailable: false,
      automaticMode: false,
      automaticStart: false,
      transferToGenerator: false,
      returnToUtility: false,
      cooldownPerformed: false,
      startDelaySeconds: "",
      transferSeconds: "",
      returnSeconds: "",
      result: "not-tested",
      notes: "",
    },
    photos: [],
    servicesPerformed: "",
    partsReplaced: "",
    conclusion: "",
    recommendations: "",
    technicianSignature: "",
    customerSignature: "",
    customerSignerName: "",
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  businessName: "",
  businessDocument: "",
  businessPhone: "",
  businessEmail: "",
  technicianName: "",
  technicianRegistration: "",
  reportFooter: "Relatório emitido eletronicamente pelo GeradorCheck Pro.",
};
