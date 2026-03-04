import { NextResponse } from "next/server";

import { authorizeRole, requireAuthContext } from "@/lib/auth/rbac";
import { handleRouteError, validationError } from "@/lib/http/errors";
import { patchBodegaService } from "@/modules/bodegas/service";
import { bodegaIdParamSchema, bodegaPatchSchema } from "@/modules/bodegas/schemas";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Params) {
  try {
    const authContext = await requireAuthContext(request);
    authorizeRole(authContext, ["ADMIN", "GERENCIA"]);

    const params = await context.params;
    const parsedParams = bodegaIdParamSchema.safeParse(params);

    if (!parsedParams.success) {
      throw validationError({ issues: parsedParams.error.issues });
    }

    const payload = await request.json();
    const parsedBody = bodegaPatchSchema.safeParse(payload);

    if (!parsedBody.success) {
      throw validationError({ issues: parsedBody.error.issues });
    }

    const updated = await patchBodegaService(parsedParams.data.id, parsedBody.data);
    return NextResponse.json(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}