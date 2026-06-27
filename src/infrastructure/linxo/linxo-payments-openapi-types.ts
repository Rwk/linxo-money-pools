export type {
  components,
  operations,
  paths
} from "@/generated/linxo-payments-api";

import type { components, operations } from "@/generated/linxo-payments-api";

export type LinxoTokenRequestBody =
  operations["postToken"]["requestBody"]["content"]["application/x-www-form-urlencoded"];

export type LinxoTokenResponse =
  operations["postToken"]["responses"][200]["content"]["application/json"];

export type LinxoErrorResponse = components["schemas"]["ErrorModel"];

export type LinxoCreateOrderRequest =
  operations["postOrder"]["requestBody"]["content"]["application/json"];

export type LinxoOrder =
  operations["postOrder"]["responses"][201]["content"]["application/json"];

export type LinxoShortenOrderRequest =
  NonNullable<
    operations["postOrderShorten"]["requestBody"]
  >["content"]["application/json"];

export type LinxoShortenOrderResponse =
  operations["postOrderShorten"]["responses"][200]["content"]["application/json"];

export type LinxoRunningOrder =
  operations["getRunningOrder"]["responses"][200]["content"]["application/json"];

export type LinxoOrderPaymentMethod =
  components["schemas"]["PaymentMethods"][number];
