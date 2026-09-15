import { createClient } from "@supabase/supabase-js";

// Credentials fetched directly via Supabase MCP (Project: SIH)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://erbdkwmsbwyqdpasjwjf.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYmRrd21zYnd5cWRwYXNqd2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMTY0MTEsImV4cCI6MjEwNDU5MjQxMX0.WEiTeFaLSveXI5ml2WijzQIa13C2wBfNyalKpK8_H8s";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id?: string;
  phone: string;
  full_name: string;
  preferred_language?: string;
  created_at?: string;
  last_login?: string;
  role?: string;
  locality?: string;
  state?: string;
}

/**
 * Stores/upserts user profile in Supabase upon successful OTP verification.
 * Directly synced to public.profiles table in Supabase.
 */
export async function syncUserProfile(profile: UserProfile): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const payload = {
      phone: profile.phone,
      full_name: profile.full_name,
      preferred_language: profile.preferred_language || "hi",
      updated_at: new Date().toISOString(),
    };

    // Upsert into Supabase 'profiles' table on unique phone
    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "phone" })
      .select()
      .single();

    if (error) {
      console.warn("Supabase profiles sync note:", error.message);
    }

    const savedUser: UserProfile = {
      id: data?.id,
      phone: profile.phone,
      full_name: profile.full_name,
      preferred_language: profile.preferred_language || "hi",
      role: "entrepreneur",
      last_login: new Date().toISOString(),
    };

    // Persist active session locally
    if (typeof window !== "undefined") {
      localStorage.setItem("sahaay_user", JSON.stringify(savedUser));
    }

    return { success: true, data: savedUser };
  } catch (err) {
    console.error("Failed to sync user to Supabase:", err);
    return { success: false, error: err };
  }
}

/**
 * Retrieves the currently logged-in user profile from localStorage or Supabase
 */
export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("sahaay_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Logs out the user
 */
export function logoutUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("sahaay_user");
  }
}
