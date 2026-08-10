export type LicenseStatus =
  "trial" | "pending" | "active" | "suspended" | "revoked";

export type ChecklistStatus = "ok" | "attention" | "na" | "pending";

export interface UserProfile {
  uid: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  role: "customer" | "admin";
  consentAcceptedAt?: string;
}

export interface DeviceSummary {
  id: string;
  label: string;
  platform: string;
  createdAt: string;
  lastSeenAt: string;
  active: boolean;
}

export interface LicenseSnapshot {
  uid: string;
  status: LicenseStatus;
  licenseCode: string | null;
  entitlementVersion: string;
  perpetual: boolean;
  ownerName: string;
  ownerCompany: string;
  trialUsed: number;
  trialLimit: number;
  trialRemaining: number;
  maxDevices: number;
  currentDeviceAllowed: boolean;
  currentDeviceId: string;
  devices: DeviceSummary[];
  activatedAt: string | null;
  lastValidatedAt: string;
  isAdmin: boolean;
}

export interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  status: ChecklistStatus;
  observation: string;
}

export interface PhotoEvidence {
  id: string;
  dataUrl: string;
  caption: string;
  createdAt: string;
}

export interface Measurements {
  voltageL1L2: string;
  voltageL2L3: string;
  voltageL3L1: string;
  currentL1: string;
  currentL2: string;
  currentL3: string;
  frequency: string;
  batteryVoltage: string;
  coolantTemperature: string;
  oilPressure: string;
  rpm: string;
  loadPercent: string;
}

export interface QtaTest {
  utilityAvailable: boolean;
  automaticMode: boolean;
  automaticStart: boolean;
  transferToGenerator: boolean;
  returnToUtility: boolean;
  cooldownPerformed: boolean;
  startDelaySeconds: string;
  transferSeconds: string;
  returnSeconds: string;
  result: "approved" | "attention" | "not-tested";
  notes: string;
}

export type ServiceStatus = "draft" | "completed";

export interface ServiceRecord {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  status: ServiceStatus;
  trialCompletionRegistered: boolean;
  customer: {
    name: string;
    document: string;
    responsible: string;
    phone: string;
    email: string;
    address: string;
  };
  equipment: {
    manufacturer: string;
    model: string;
    serialNumber: string;
    powerKva: string;
    fuel: string;
    hourmeter: string;
    location: string;
    controller: string;
  };
  service: {
    type: string;
    technician: string;
    startDate: string;
    startTime: string;
    endTime: string;
  };
  checklist: ChecklistItem[];
  measurements: Measurements;
  qta: QtaTest;
  photos: PhotoEvidence[];
  servicesPerformed: string;
  partsReplaced: string;
  conclusion: string;
  recommendations: string;
  technicianSignature: string;
  customerSignature: string;
  customerSignerName: string;
}

export interface AppSettings {
  businessName: string;
  businessDocument: string;
  businessPhone: string;
  businessEmail: string;
  technicianName: string;
  technicianRegistration: string;
  reportFooter: string;
}

export interface ActivationRequest {
  requestCode: string;
  status: "pending" | "approved" | "cancelled";
  whatsappUrl: string;
  createdAt: string;
}

export interface AdminLicenseRow {
  uid: string;
  email: string;
  name: string;
  company: string;
  phone: string;
  status: LicenseStatus;
  licenseCode: string | null;
  trialUsed: number;
  trialLimit: number;
  maxDevices: number;
  deviceCount: number;
  activatedAt: string | null;
  updatedAt: string;
}
