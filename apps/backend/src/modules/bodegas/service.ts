import { conflictError, notFoundError } from "@/lib/http/errors";

import { createBodega, listBodegas, patchBodega } from "./repository";
import type { BodegaCreateInput, BodegaPatchInput } from "./schemas";

export async function getBodegasService() {
  const { data, error } = await listBodegas();

  if (error) {
    throw conflictError("Could not fetch bodegas", { db: error.message });
  }

  return data;
}

export async function createBodegaService(input: BodegaCreateInput) {
  const { data, error } = await createBodega(input);

  if (error || !data) {
    throw conflictError("Could not create bodega", { db: error?.message });
  }

  return data;
}

export async function patchBodegaService(id: string, input: BodegaPatchInput) {
  const { data, error } = await patchBodega(id, input);

  if (error) {
    throw conflictError("Could not update bodega", { db: error.message });
  }

  if (!data) {
    throw notFoundError("Bodega not found");
  }

  return data;
}
