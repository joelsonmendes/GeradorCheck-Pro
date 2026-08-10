import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

initializeApp();
const uid = process.argv[2] ?? "";
if (!uid) {
  console.error("Uso: npm run grant-admin -- UID_DO_USUARIO");
  process.exit(1);
}

async function main() {
  const auth = getAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, {
    ...(user.customClaims || {}),
    admin: true,
  });
  await getFirestore()
    .doc(`users/${uid}`)
    .set({ role: "admin", updatedAt: Timestamp.now() }, { merge: true });
  console.log(
    `Administrador concedido a ${user.email || uid}. Peça ao usuário para sair e entrar novamente.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
