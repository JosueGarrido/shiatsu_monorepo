import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/rbac";
import { handleRouteError, validationError } from "@/lib/http/errors";
import { getStockByBodegaService } from "@/modules/stock/service";
import { stockBodegaIdSchema } from "@/modules/stock/schemas";

type Params = { params: Promise<{ bodega_id: string }> };

export async function GET(request: Request, context: Params) {
  try {
    await requireAuthContext(request);

    const params = await context.params;
    const parsed = stockBodegaIdSchema.safeParse(params);

    if (!parsed.success) {
      throw validationError({ issues: parsed.error.issues });
    }

    const stock = await getStockByBodegaService(parsed.data.bodega_id);
    return NextResponse.json(stock);
  } catch (error) {
    return handleRouteError(error);
  }
}