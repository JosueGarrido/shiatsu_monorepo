import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/rbac";
import { handleRouteError, validationError } from "@/lib/http/errors";
import { getMovimientosService } from "@/modules/movimientos/service";
import { movimientosQuerySchema } from "@/modules/movimientos/schemas";

export async function GET(request: Request) {
  try {
    await requireAuthContext(request);

    const url = new URL(request.url);
    const parsed = movimientosQuerySchema.safeParse({
      tipo: url.searchParams.get("tipo") ?? undefined,
      bodega_id: url.searchParams.get("bodega_id") ?? undefined,
      desde: url.searchParams.get("desde") ?? undefined,
      hasta: url.searchParams.get("hasta") ?? undefined
    });

    if (!parsed.success) {
      throw validationError({ issues: parsed.error.issues });
    }

    const movimientos = await getMovimientosService(parsed.data);
    return NextResponse.json(movimientos);
  } catch (error) {
    return handleRouteError(error);
  }
}
