import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/rbac";
import { handleRouteError, validationError } from "@/lib/http/errors";
import { getMovimientoByIdService } from "@/modules/movimientos/service";
import { movimientoIdParamSchema } from "@/modules/movimientos/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Params) {
  try {
    await requireAuthContext(request);

    const params = await context.params;
    const parsed = movimientoIdParamSchema.safeParse(params);

    if (!parsed.success) {
      throw validationError({ issues: parsed.error.issues });
    }

    const movimiento = await getMovimientoByIdService(parsed.data.id);
    return NextResponse.json(movimiento);
  } catch (error) {
    return handleRouteError(error);
  }
}
