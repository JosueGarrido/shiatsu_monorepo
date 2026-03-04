import { NextResponse } from "next/server";

import { authorizeRole, requireAuthContext } from "@/lib/auth/rbac";
import { handleRouteError, validationError } from "@/lib/http/errors";
import { createCompraService } from "@/modules/movimientos/service";
import { compraRequestSchema } from "@/modules/movimientos/schemas";

export async function POST(request: Request) {
  try {
    const context = await requireAuthContext(request);
    authorizeRole(context, ["ADMIN", "GERENCIA", "BODEGUERO"]);

    const payload = await request.json();
    const parsed = compraRequestSchema.safeParse(payload);

    if (!parsed.success) {
      throw validationError({ issues: parsed.error.issues });
    }

    const created = await createCompraService(parsed.data, context.userId);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
