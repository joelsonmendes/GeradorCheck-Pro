"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
const uid = process.argv[2] ?? "";
if (!uid) {
    console.error("Uso: npm run grant-admin -- UID_DO_USUARIO");
    process.exit(1);
}
async function main() {
    const auth = (0, auth_1.getAuth)();
    const user = await auth.getUser(uid);
    await auth.setCustomUserClaims(uid, {
        ...(user.customClaims || {}),
        admin: true,
    });
    await (0, firestore_1.getFirestore)()
        .doc(`users/${uid}`)
        .set({ role: "admin", updatedAt: firestore_1.Timestamp.now() }, { merge: true });
    console.log(`Administrador concedido a ${user.email || uid}. Peça ao usuário para sair e entrar novamente.`);
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
