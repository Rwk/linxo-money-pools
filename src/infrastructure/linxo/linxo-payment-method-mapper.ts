import type { PaymentMethod } from "@/domain/pool/pool.types";
import type { LinxoOrderPaymentMethod } from "@/infrastructure/linxo/linxo-payments-openapi-types";

const LINXO_PAYMENT_METHOD_BY_PAYMENT_METHOD: Record<
  PaymentMethod,
  LinxoOrderPaymentMethod
> = {
  STANDARD: "INITIATED_WIRE_TRANSFER",
  INSTANT: "INITIATED_INSTANT_TRANSFER"
};

export function mapPaymentMethodToLinxoPaymentMethods(
  paymentMethod: PaymentMethod
): [LinxoOrderPaymentMethod] {
  return [LINXO_PAYMENT_METHOD_BY_PAYMENT_METHOD[paymentMethod]];
}
