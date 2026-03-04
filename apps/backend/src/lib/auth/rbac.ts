import type { PerfilRol } from "@shiatsu/types";

import { forbiddenError, unauthorizedError } from "@/lib/http/errors";
import { supabaseAnonClient, supabaseServiceClient } from "@/lib/supabase";

export type AuthContext = {
  userId: string;
  role: PerfilRol;
  bodegaAsignadaId: string | null;
};

function extractBearerToken(request: Request): string {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    throw unauthorizedError();
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    throw unauthorizedError();
  }

  return token;
}

export async function requireAuthContext(request: Request): Promise<AuthContext> {
  const token = extractBearerToken(request);
  const { data: userData, error: userError } = await supabaseAnonClient.auth.getUser(token);

  if (userError || !userData.user) {
    throw unauthorizedError();
  }

  const { data: profile, error: profileError } = await supabaseServiceClient
    .from("perfiles")
    .select("id, rol, bodega_asignada_id")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw unauthorizedError();
  }

  return {
    userId: profile.id,
    role: profile.rol as PerfilRol,
    bodegaAsignadaId: profile.bodega_asignada_id
  };
}

export function authorizeRole(context: AuthContext, allowedRoles: PerfilRol[]) {
  if (!allowedRoles.includes(context.role)) {
    throw forbiddenError();
  }
}