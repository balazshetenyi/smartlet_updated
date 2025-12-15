import { Session } from "@supabase/supabase-js";
import {
  createContext,
  PropsWithChildren,
  ReactNode,
  useContext,
  useState,
} from "react";

type AuthContextType = {
  isLoggedIn: boolean;
  session: Session | null;
  profile?: UserProfile | null;
  loading?: boolean;
  signIn?: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  signOut?: () => Promise<void>;
  signUpWithEmail?: (
    data: SignUpData
  ) => Promise<{ success: boolean; error?: string }>;
  refreshProfile?: () => Promise<UserProfile | null> | null;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
}: PropsWithChildren) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        session,
        profile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
