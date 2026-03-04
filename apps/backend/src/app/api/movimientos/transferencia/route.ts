import { handleRouteError, ApiError } from "@/lib/http/errors";
import { authorizeRole, requireAuthContext } from "@/lib/auth/rbac";

export async function POST(request: Request) {
  try {
    const context = await requireAuthContext(request);
    authorizeRole(context, ["ADMIN", "GERENCIA", "BODEGUERO"]);

    throw new ApiError(501, "NOT_IMPLEMENTED", "Transferencia planned for next iteration");
  } catch (error) {
    return handleRouteError(error);
  }
}