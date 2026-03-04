import { NextResponse } from "next/server";

import { authorizeRole, requireAuthContext } from "@/lib/auth/rbac";
import { handleRouteError, validationError } from "@/lib/http/errors";
import { createBodegaService, getBodegasService } from "@/modules/bodegas/service";
import { bodegaCreateSchema } from "@/modules/bodegas/schemas";

export async function GET(request: Request) {
  try {
    await requireAuthContext(request);
    const bodegas = await getBodegasService();
    return NextResponse.json(bodegas);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireAuthContext(request);
    authorizeRole(context, ["ADMIN", "GERENCIA"]);

    const payload = await request.json();
    const parsed = bodegaCreateSchema.safeParse(payload);

    if (!parsed.success) {
      throw validationError({ issues: parsed.error.issues });
    }

    const created = await createBodegaService(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
