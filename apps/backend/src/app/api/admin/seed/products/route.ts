import { NextResponse } from "next/server";

import { authorizeRole, requireAuthContext } from "@/lib/auth/rbac";
import { handleRouteError, validationError } from "@/lib/http/errors";
import { seedProductosService } from "@/modules/productos/service";
import { productsSeedSchema } from "@/modules/productos/schemas";

export async function POST(request: Request) {
  try {
    const context = await requireAuthContext(request);
    authorizeRole(context, ["ADMIN", "GERENCIA"]);

    const payload = await request.json();
    const parsed = productsSeedSchema.safeParse(payload);

    if (!parsed.success) {
      throw validationError({ issues: parsed.error.issues });
    }

    const result = await seedProductosService(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
