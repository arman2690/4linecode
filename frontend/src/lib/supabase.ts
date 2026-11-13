import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes("your-project")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock auth session helper for local testing when keys are not yet plugged in
export interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
  };
}

export const defaultMockUser: MockUser = {
  id: "dev-user-00000000-0000-0000-0000-000000000001",
  email: "demo@receiptiq.local",
  user_metadata: {
    full_name: "Arman Demo User",
  },
};
