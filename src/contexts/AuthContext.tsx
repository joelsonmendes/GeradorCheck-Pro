import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiPost } from "../lib/api";
import { auth } from "../lib/firebase";

interface RegistrationData {
  name: string;
  company: string;
  phone: string;
  email: string;
  password: string;
  consent: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      }),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      async register(data) {
        if (!data.consent)
          throw new Error(
            "É necessário aceitar os termos e o registro do aparelho.",
          );
        const credential = await createUserWithEmailAndPassword(
          auth,
          data.email.trim(),
          data.password,
        );
        await updateProfile(credential.user, { displayName: data.name.trim() });
        await credential.user.getIdToken(true);
        await apiPost("/auth/bootstrap", {
          name: data.name.trim(),
          company: data.company.trim(),
          phone: data.phone.trim(),
          consent: data.consent,
        });
      },
      async logout() {
        await signOut(auth);
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(auth, email.trim());
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
