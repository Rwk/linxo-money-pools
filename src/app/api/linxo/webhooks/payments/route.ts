import { logLinxoDiagnostic } from "@/infrastructure/linxo/linxo-api-logger";
import { syncContributionStatusByOrderId } from "@/features/contributions/services/sync-contribution-status";
import { isValidLinxoWebhookToken } from "@/infrastructure/linxo/linxo-webhook-secret";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const resourceType = searchParams.get("resource_type");
  const resourceId = searchParams.get("resource_id");

  if (!isValidLinxoWebhookToken(token)) {
    return new Response(null, { status: 401 });
  }

  if (resourceType !== "orders") {
    return new Response(null, { status: 204 });
  }

  if (!resourceId) {
    return new Response(null, { status: 400 });
  }

  try {
    const result = await syncContributionStatusByOrderId(resourceId);

    if (result.status === "not_found") {
      logLinxoDiagnostic("processWebhook", "local_order_not_found");
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    logLinxoDiagnostic("processWebhook", error);

    return new Response(null, { status: 500 });
  }
}
