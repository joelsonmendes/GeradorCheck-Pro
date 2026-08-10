"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const node_crypto_1 = require("node:crypto");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const params_1 = require("firebase-functions/params");
const https_1 = require("firebase-functions/v2/https");
const helmet_1 = __importDefault(require("helmet"));
const zod_1 = require("zod");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const sellerWhatsapp = (0, params_1.defineString)("SELLER_WHATSAPP_E164", {
    description: "WhatsApp do vendedor com DDI e DDD, somente números.",
});
const app = (0, express_1.default)();
class ApiError extends Error {
    status;
    code;
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
app.disable("x-powered-by");
app.use((0, helmet_1.default)({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json({ limit: "256kb" }));
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60_000,
    limit: 240,
    standardHeaders: "draft-8",
    legacyHeaders: false,
}));
function asyncRoute(handler) {
    return (req, res, next) => void handler(req, res).catch(next);
}
async function requireAuth(req, _res, next) {
    try {
        const match = req.headers.authorization?.match(/^Bearer (.+)$/);
        if (!match?.[1])
            throw new ApiError(401, "authentication_required", "Faça login para continuar.");
        req.authUser = await (0, auth_1.getAuth)().verifyIdToken(match[1], true);
        next();
    }
    catch (error) {
        next(error instanceof ApiError
            ? error
            : new ApiError(401, "invalid_token", "Sua sessão expirou. Entre novamente."));
    }
}
function requireAdmin(req, _res, next) {
    if (req.authUser?.admin === true)
        next();
    else
        next(new ApiError(403, "admin_required", "Acesso restrito ao administrador."));
}
function hashDevice(installationId) {
    return (0, node_crypto_1.createHash)("sha256").update(installationId).digest("hex");
}
function publicDeviceId(hash) {
    return hash.slice(0, 12).toUpperCase();
}
function activationCode() {
    return `GC-${(0, node_crypto_1.randomBytes)(3).toString("hex").toUpperCase()}`;
}
function licenseCode() {
    const code = (0, node_crypto_1.randomBytes)(4).toString("hex").toUpperCase();
    return `GCP-${code.slice(0, 4)}-${code.slice(4)}`;
}
function iso(value) {
    return value instanceof firestore_1.Timestamp ? value.toDate().toISOString() : null;
}
async function ensureAccount(uid, input) {
    const userRecord = await (0, auth_1.getAuth)().getUser(uid);
    const userRef = db.doc(`users/${uid}`);
    const licenseRef = db.doc(`licenses/${uid}`);
    await db.runTransaction(async (tx) => {
        const [userSnap, licenseSnap] = await Promise.all([
            tx.get(userRef),
            tx.get(licenseRef),
        ]);
        const now = firestore_1.Timestamp.now();
        const name = input?.name?.trim() ||
            userRecord.displayName ||
            userSnap.get("name") ||
            "Comprador";
        const company = input?.company?.trim() || userSnap.get("company") || "";
        tx.set(userRef, {
            uid,
            name,
            company,
            phone: input?.phone?.trim() || userSnap.get("phone") || "",
            email: userRecord.email || "",
            role: userSnap.get("role") || "customer",
            consentAcceptedAt: input?.consent
                ? now
                : userSnap.get("consentAcceptedAt") || null,
            createdAt: userSnap.get("createdAt") || now,
            updatedAt: now,
        }, { merge: true });
        if (!licenseSnap.exists) {
            const license = {
                uid,
                status: "trial",
                licenseCode: null,
                entitlementVersion: "1",
                perpetual: false,
                ownerName: name,
                ownerCompany: company,
                trialUsed: 0,
                trialLimit: 3,
                maxDevices: 1,
                activatedAt: null,
                createdAt: now,
                updatedAt: now,
            };
            tx.create(licenseRef, license);
        }
        else {
            tx.update(licenseRef, {
                ownerName: name,
                ownerCompany: company,
                updatedAt: now,
            });
        }
    });
}
async function makeSnapshot(uid, deviceHash, isAdmin) {
    const [licenseSnap, deviceSnaps] = await Promise.all([
        db.doc(`licenses/${uid}`).get(),
        db
            .collection(`licenses/${uid}/devices`)
            .orderBy("lastSeenAt", "desc")
            .limit(20)
            .get(),
    ]);
    if (!licenseSnap.exists)
        throw new ApiError(404, "license_not_found", "Licença não encontrada.");
    const data = licenseSnap.data();
    const devices = deviceSnaps.docs.map((document) => {
        const item = document.data();
        return {
            id: publicDeviceId(document.id),
            label: item.label || "Aparelho",
            platform: item.platform || "Navegador",
            createdAt: iso(item.createdAt),
            lastSeenAt: iso(item.lastSeenAt),
            active: item.active === true,
        };
    });
    const current = deviceSnaps.docs.find((document) => document.id === deviceHash);
    return {
        uid,
        status: data.status,
        licenseCode: data.licenseCode,
        entitlementVersion: data.entitlementVersion || "1",
        perpetual: data.perpetual === true,
        ownerName: data.ownerName,
        ownerCompany: data.ownerCompany,
        trialUsed: data.trialUsed,
        trialLimit: data.trialLimit,
        trialRemaining: Math.max(0, data.trialLimit - data.trialUsed),
        maxDevices: data.maxDevices,
        currentDeviceAllowed: current?.get("active") === true,
        currentDeviceId: publicDeviceId(deviceHash),
        devices,
        activatedAt: iso(data.activatedAt),
        lastValidatedAt: new Date().toISOString(),
        isAdmin,
    };
}
app.get("/health", (_req, res) => res.json({
    ok: true,
    service: "geradorcheck-pro",
    time: new Date().toISOString(),
}));
app.use(requireAuth);
app.post("/auth/bootstrap", asyncRoute(async (req, res) => {
    const input = zod_1.z
        .object({
        name: zod_1.z.string().min(2).max(100),
        company: zod_1.z.string().min(2).max(120),
        phone: zod_1.z.string().min(8).max(30),
        consent: zod_1.z.literal(true),
    })
        .parse(req.body);
    await ensureAccount(req.authUser.uid, input);
    res.status(201).json({ ok: true });
}));
app.post("/device/register", asyncRoute(async (req, res) => {
    const input = zod_1.z
        .object({
        installationId: zod_1.z.string().min(12).max(100),
        label: zod_1.z.string().min(2).max(100),
        platform: zod_1.z.string().min(2).max(60),
    })
        .parse(req.body);
    const uid = req.authUser.uid;
    await ensureAccount(uid);
    const deviceHash = hashDevice(input.installationId);
    const licenseRef = db.doc(`licenses/${uid}`);
    const deviceRef = db.doc(`licenses/${uid}/devices/${deviceHash}`);
    await db.runTransaction(async (tx) => {
        const licenseSnap = await tx.get(licenseRef);
        const deviceSnap = await tx.get(deviceRef);
        const activeDevices = await tx.get(db.collection(`licenses/${uid}/devices`).where("active", "==", true));
        const license = licenseSnap.data();
        const now = firestore_1.Timestamp.now();
        if (deviceSnap.exists) {
            const canReactivate = deviceSnap.get("active") === true ||
                activeDevices.size < license.maxDevices;
            tx.update(deviceRef, {
                label: input.label,
                platform: input.platform,
                active: canReactivate,
                lastSeenAt: now,
            });
        }
        else if (activeDevices.size < license.maxDevices) {
            tx.create(deviceRef, {
                label: input.label,
                platform: input.platform,
                active: true,
                createdAt: now,
                lastSeenAt: now,
            });
        }
    });
    res.json(await makeSnapshot(uid, deviceHash, req.authUser.admin === true));
}));
app.post("/trial/complete", asyncRoute(async (req, res) => {
    const input = zod_1.z
        .object({
        serviceId: zod_1.z.string().uuid(),
        installationId: zod_1.z.string().min(12).max(100),
    })
        .parse(req.body);
    const uid = req.authUser.uid;
    const deviceHash = hashDevice(input.installationId);
    const licenseRef = db.doc(`licenses/${uid}`);
    const completionRef = db.doc(`licenses/${uid}/trialCompletions/${input.serviceId}`);
    const deviceRef = db.doc(`licenses/${uid}/devices/${deviceHash}`);
    await db.runTransaction(async (tx) => {
        const [licenseSnap, completionSnap, deviceSnap] = await Promise.all([
            tx.get(licenseRef),
            tx.get(completionRef),
            tx.get(deviceRef),
        ]);
        if (completionSnap.exists)
            return;
        if (!deviceSnap.exists || deviceSnap.get("active") !== true)
            throw new ApiError(403, "device_not_allowed", "Este aparelho não está autorizado.");
        const license = licenseSnap.data();
        if (license.status === "active") {
            tx.create(completionRef, {
                uid,
                serviceId: input.serviceId,
                licensed: true,
                createdAt: firestore_1.Timestamp.now(),
            });
            return;
        }
        if (license.status !== "trial")
            throw new ApiError(403, "license_blocked", "Ative ou regularize sua licença para concluir a OS.");
        if (license.trialUsed >= license.trialLimit)
            throw new ApiError(403, "trial_exhausted", "O limite de ordens de serviço gratuitas foi atingido.");
        tx.create(completionRef, {
            uid,
            serviceId: input.serviceId,
            deviceId: publicDeviceId(deviceHash),
            createdAt: firestore_1.Timestamp.now(),
        });
        tx.update(licenseRef, {
            trialUsed: firestore_1.FieldValue.increment(1),
            updatedAt: firestore_1.Timestamp.now(),
        });
    });
    res.json(await makeSnapshot(uid, deviceHash, req.authUser.admin === true));
}));
app.post("/activation/request", asyncRoute(async (req, res) => {
    const input = zod_1.z
        .object({ installationId: zod_1.z.string().min(12).max(100) })
        .parse(req.body);
    const uid = req.authUser.uid;
    const [licenseSnap, userSnap] = await Promise.all([
        db.doc(`licenses/${uid}`).get(),
        db.doc(`users/${uid}`).get(),
    ]);
    if (!licenseSnap.exists)
        throw new ApiError(404, "license_not_found", "Licença não encontrada.");
    const license = licenseSnap.data();
    const requestRef = db.doc(`activationRequests/${uid}`);
    const previous = await requestRef.get();
    const requestCode = previous.get("status") === "pending"
        ? previous.get("requestCode")
        : activationCode();
    const now = firestore_1.Timestamp.now();
    await requestRef.set({
        uid,
        requestCode,
        status: license.status === "active" ? "approved" : "pending",
        deviceId: publicDeviceId(hashDevice(input.installationId)),
        name: userSnap.get("name") || license.ownerName,
        company: userSnap.get("company") || license.ownerCompany,
        email: userSnap.get("email") || req.authUser.email || "",
        phone: userSnap.get("phone") || "",
        createdAt: previous.get("createdAt") || now,
        updatedAt: now,
    }, { merge: true });
    if (license.status === "trial")
        await licenseSnap.ref.update({ status: "pending", updatedAt: now });
    const text = [
        `Olá! Quero ativar o GeradorCheck Pro.`,
        `Código: ${requestCode}`,
        `Nome: ${userSnap.get("name") || license.ownerName}`,
        `Empresa: ${userSnap.get("company") || license.ownerCompany}`,
        `E-mail: ${userSnap.get("email") || req.authUser.email || ""}`,
        `Aparelho: ${publicDeviceId(hashDevice(input.installationId))}`,
    ].join("\n");
    res.json({
        requestCode,
        status: license.status === "active" ? "approved" : "pending",
        whatsappUrl: `https://wa.me/${sellerWhatsapp.value().replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
        createdAt: iso(previous.get("createdAt")) || now.toDate().toISOString(),
    });
}));
app.use("/admin", requireAdmin);
app.get("/admin/licenses", asyncRoute(async (_req, res) => {
    const snapshots = await db
        .collection("licenses")
        .orderBy("updatedAt", "desc")
        .limit(300)
        .get();
    const items = await Promise.all(snapshots.docs.map(async (document) => {
        const data = document.data();
        const [user, devices] = await Promise.all([
            db.doc(`users/${document.id}`).get(),
            db
                .collection(`licenses/${document.id}/devices`)
                .where("active", "==", true)
                .get(),
        ]);
        return {
            uid: document.id,
            email: user.get("email") || "",
            name: user.get("name") || data.ownerName,
            company: user.get("company") || data.ownerCompany,
            phone: user.get("phone") || "",
            status: data.status,
            licenseCode: data.licenseCode,
            trialUsed: data.trialUsed,
            trialLimit: data.trialLimit,
            maxDevices: data.maxDevices,
            deviceCount: devices.size,
            activatedAt: iso(data.activatedAt),
            updatedAt: iso(data.updatedAt),
        };
    }));
    res.json({ items });
}));
app.get("/admin/activation-requests", asyncRoute(async (_req, res) => {
    const snapshots = await db
        .collection("activationRequests")
        .orderBy("updatedAt", "desc")
        .limit(300)
        .get();
    res.json({
        items: snapshots.docs.map((document) => ({
            id: document.id,
            ...document.data(),
            createdAt: iso(document.get("createdAt")),
            updatedAt: iso(document.get("updatedAt")),
        })),
    });
}));
app.post("/admin/licenses/:uid/action", asyncRoute(async (req, res) => {
    const input = zod_1.z
        .object({
        action: zod_1.z.enum([
            "activate",
            "suspend",
            "revoke",
            "reset-device",
            "extend-trial",
            "set-max-devices",
        ]),
        amount: zod_1.z.number().int().min(1).max(20).optional(),
        maxDevices: zod_1.z.number().int().min(1).max(10).optional(),
    })
        .parse(req.body);
    const uid = zod_1.z.string().min(10).max(128).parse(req.params.uid);
    const licenseRef = db.doc(`licenses/${uid}`);
    const licenseSnap = await licenseRef.get();
    if (!licenseSnap.exists)
        throw new ApiError(404, "license_not_found", "Licença não encontrada.");
    const now = firestore_1.Timestamp.now();
    if (input.action === "reset-device") {
        const devices = await db
            .collection(`licenses/${uid}/devices`)
            .where("active", "==", true)
            .get();
        const batch = db.batch();
        devices.docs.forEach((device) => batch.update(device.ref, { active: false, deactivatedAt: now }));
        await batch.commit();
    }
    else if (input.action === "activate") {
        const existingCode = licenseSnap.get("licenseCode");
        await licenseRef.update({
            status: "active",
            licenseCode: existingCode || licenseCode(),
            perpetual: true,
            activatedAt: licenseSnap.get("activatedAt") || now,
            updatedAt: now,
        });
        await db
            .doc(`activationRequests/${uid}`)
            .set({ status: "approved", approvedAt: now, updatedAt: now }, { merge: true });
    }
    else if (input.action === "suspend") {
        await licenseRef.update({ status: "suspended", updatedAt: now });
    }
    else if (input.action === "revoke") {
        await licenseRef.update({
            status: "revoked",
            perpetual: false,
            updatedAt: now,
        });
    }
    else if (input.action === "extend-trial") {
        await licenseRef.update({
            status: "trial",
            trialLimit: firestore_1.FieldValue.increment(input.amount || 1),
            updatedAt: now,
        });
    }
    else if (input.action === "set-max-devices") {
        await licenseRef.update({
            maxDevices: input.maxDevices || 1,
            updatedAt: now,
        });
    }
    await db.collection("auditLogs").add({
        actorUid: req.authUser.uid,
        targetUid: uid,
        action: input.action,
        payload: input,
        createdAt: now,
    });
    res.json({ ok: true });
}));
app.use((error, _req, res, _next) => {
    if (error instanceof zod_1.z.ZodError) {
        res.status(400).json({
            error: {
                code: "invalid_request",
                message: "Os dados enviados são inválidos.",
                details: error.issues,
            },
        });
        return;
    }
    if (error instanceof ApiError) {
        res
            .status(error.status)
            .json({ error: { code: error.code, message: error.message } });
        return;
    }
    console.error(error);
    res.status(500).json({
        error: {
            code: "internal_error",
            message: "Ocorreu uma falha interna. Tente novamente.",
        },
    });
});
exports.api = (0, https_1.onRequest)({
    region: "southamerica-east1",
    timeoutSeconds: 30,
    memory: "256MiB",
    maxInstances: 10,
}, app);
