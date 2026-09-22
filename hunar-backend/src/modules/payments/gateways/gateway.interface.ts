import type { Payment, PaymentGateway } from '@prisma/client';

/**
 * Contract every house-supported payment gateway implements.
 * Gateways are returned by the PaymentsModule factory keyed by PaymentGateway enum.
 */
export interface GatewayChargeResult {
  success: boolean;
  provider: PaymentGateway;
  transactionRef: string;
  /** Gateway-side status that maps onto our Payment.status */
  status: 'INITIATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
}

export interface GatewayPaymentInput {
  /** Ready-to-charge Payment row (amount + visitCharge already set). */
  payment: Payment;
  method: string;
  customerPhone: string;
  workerPhone: string;
}

export interface PaymentGatewayProvider {
  readonly name: PaymentGateway;

  /** Instruct a charge. Implementations must be idempotent on `payment.transactionRef`. */
  charge(input: GatewayPaymentInput): Promise<GatewayChargeResult>;
}

export interface PaymentGatewayOptions {
  apiKey?: string;
  secretKey?: string;
  merchantId?: string;
  sandbox: boolean;
}
