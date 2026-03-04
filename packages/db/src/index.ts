import { createClient } from "@supabase/supabase-js";

export type SupabaseRuntimeConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
};

export function createSupabaseClient(config: SupabaseRuntimeConfig) {
  return createClient(config.url, config.anonKey);
}

export function createSupabaseServiceClient(config: SupabaseRuntimeConfig) {
  if (!config.serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for service client");
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false }
  });
}