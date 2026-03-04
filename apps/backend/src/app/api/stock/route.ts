import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/rbac";
import { handleRouteError, validationError } from "@/lib/http/errors";
import { queryStockService } from "@/modules/stock/service";
import { stockQuerySchema } from "@/modules/stock/schemas";

export async function GET(request: Request) {
  try {
    await requireAuthContext(request);

    const url = new URL(request.url);
    const parsed = stockQuerySchema.safeParse({
      bodega_id: url.searchParams.get("bodega_id") ?? undefined,
      sku: url.searchParams.get("sku") ?? undefined,
      producto_id: url.searchParams.get("producto_id") ?? undefined
    });

    if (!parsed.success) {
      throw validationError({ issues: parsed.error.issues });
    }

    const stock = await queryStockService(parsed.data);
    return NextResponse.json(stock);
  } catch (error) {
    return handleRouteError(error);
  }
}
