"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { login as apiLogin } from "@/lib/api/auth";

export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const PUBLIC_PATHS = ["/login"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const DISABLE_AUTH =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_DISABLE_LOGIN === "true";

  // Check for existing session on mount
  React.useEffect(() => {
    const checkSession = () => {
      try {
        const stored = localStorage.getItem("osmedeus_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        }
      } catch {
        localStorage.removeItem("osmedeus_session");
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Redirect logic
  React.useEffect(() => {
    if (isLoading) return;
    if (DISABLE_AUTH) return;

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    if (!user && !isPublicPath) {
      router.push("/login");
    } else if (user && isPublicPath) {
      router.push("/");
    }
  }, [user, isLoading, pathname, router]);

  const login = React.useCallback(
    async (username: string, password: string) => {
      const token = await apiLogin(username, password);
      localStorage.setItem("osmedeus_token", token);
      const userData: User = {
        id: `user-${Date.now()}`,
        username,
        email: `${username}@osmedeus.io`,
        name: username.charAt(0).toUpperCase() + username.slice(1),
      };
      localStorage.setItem("osmedeus_session", JSON.stringify(userData));
      setUser(userData);
      router.push("/");
    },
    [router]
  );

  const logout = React.useCallback(() => {
    localStorage.removeItem("osmedeus_token");
    localStorage.removeItem("osmedeus_session");
    setUser(null);
    router.push("/login");
  }, [router]);

  React.useEffect(() => {
    if (!isLoading && DISABLE_AUTH && !user) {
      setUser({
        id: "guest",
        username: "guest",
        email: "guest@osmedeus.io",
        name: "Guest",
      });
    }
  }, [isLoading, DISABLE_AUTH, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: DISABLE_AUTH || !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
