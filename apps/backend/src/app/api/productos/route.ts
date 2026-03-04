import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/rbac";
import { handleRouteError, validationError } from "@/lib/http/errors";
import { getProductosService } from "@/modules/productos/service";
import { productosQuerySchema } from "@/modules/productos/schemas";

export async function GET(request: Request) {
  try {
    await requireAuthContext(request);

    const url = new URL(request.url);
    const parsed = productosQuerySchema.safeParse({
      search: url.searchParams.get("search") ?? undefined,
      sku: url.searchParams.get("sku") ?? undefined
    });

    if (!parsed.success) {
      throw validationError({ issues: parsed.error.issues });
    }

    const products = await getProductosService(parsed.data);
    const productosArray = Array.isArray(products) ? products : [];
    return NextResponse.json(productosArray, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
