import { supabaseServiceClient } from "@/lib/supabase";

import type { BodegaCreateInput, BodegaPatchInput } from "./schemas";

export async function listBodegas() {
  return supabaseServiceClient
    .from("bodegas")
    .select("id, nombre, tipo, direccion, activo")
    .order("nombre", { ascending: true });
}

export async function createBodega(input: BodegaCreateInput) {
  return supabaseServiceClient
    .from("bodegas")
    .insert({
      nombre: input.nombre,
      tipo: input.tipo,
      direccion: input.direccion ?? null
    })
    .select("id, nombre, tipo, direccion, activo")
    .single();
}

export async function patchBodega(id: string, input: BodegaPatchInput) {
  return supabaseServiceClient
    .from("bodegas")
    .update(input)
    .eq("id", id)
    .select("id, nombre, tipo, direccion, activo")
    .maybeSingle();
}
