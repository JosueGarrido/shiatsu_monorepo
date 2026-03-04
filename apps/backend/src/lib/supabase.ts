import { createSupabaseClient, createSupabaseServiceClient } from "@shiatsu/db";

import { getSupabaseEnv } from "@/lib/env";

const supabaseEnv = getSupabaseEnv();

export const supabaseAnonClient = createSupabaseClient({
  url: supabaseEnv.url,
  anonKey: supabaseEnv.anonKey
});

export const supabaseServiceClient = createSupabaseServiceClient({
  url: supabaseEnv.url,
  anonKey: supabaseEnv.anonKey,
  serviceRoleKey: supabaseEnv.serviceRoleKey
});
