import { syncContributionStatusByOrderId } from "@/features/contributions/services/sync-contribution-status";
import { isValidLinxoWebhookToken } from "@/infrastructure/linxo/linxo-webhook-secret";

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
      console.warn("Linxo webhook order was not found locally.", {
        resourceType,
        resourceId
      });
    }

    return new Response(null, { status: 204 });
  } catch {
    console.error("Linxo webhook processing failed.", {
      resourceType,
      resourceId
    });

    return new Response(null, { status: 500 });
  }
}
