"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  token: null,
  loading: true,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Initialize session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      if (session?.access_token) {
        document.cookie = `hackmitra_user_token=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      if (session?.access_token) {
        document.cookie = `hackmitra_user_token=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
      } else {
        document.cookie = "hackmitra_user_token=; path=/; max-age=0";
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return { success: false, error: "Supabase client not configured" };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setSession(data.session);
      setUser(data.user);
      setToken(data.session?.access_token ?? null);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to sign in" };
    }
  };

  const signUp = async (email: string, password: string) => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return { success: false, error: "Supabase client not configured" };

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        setToken(data.session.access_token);
        setIsAuthModalOpen(false);
      }

      return {
        success: true,
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create account" };
    }
  };

  const signOut = async () => {
    const supabase = createBrowserSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setToken(null);
    document.cookie = "hackmitra_user_token=; path=/; max-age=0";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
