import { Injectable } from '@nestjs/common';
import { PaymentGateway } from '@prisma/client';
import {
  GatewayChargeResult,
  GatewayPaymentInput,
  PaymentGatewayProvider,
} from './gateway.interface';

/**
 * JazzCash (house gateway, Module 3 — Payments Backend, Shafqat).
 *
 * Mirrors the easypaisa contract exactly — idempotent on `payment.transactionRef`,
 * deterministic house prefix stored on the Payment row so the verifier can cross
 * the gateway response against the house ledger without a second lookup.
 */
@Injectable()
export class JazzCashGateway implements PaymentGatewayProvider {
  readonly name = PaymentGateway.JAZZCASH;

  private readonly options = {
    merchantId: process.env.JAZZCASH_MERCHANT_ID ?? 'jc.mobile.marchant',
    sandbox: process.env.JAZZCASH_ENV !== 'live',
  };

  async charge(input: GatewayPaymentInput): Promise<GatewayChargeResult> {
    const { payment } = input;
    const transactionRef =
      payment.transactionRef ??
      `jc-${this.options.sandbox ? 'sbx' : 'live'}-${payment.id.slice(-12)}`;

    return {
      success: true,
      provider: this.name,
      transactionRef,
      status: this.options.sandbox ? 'PROCESSING' : 'COMPLETED',
    };
  }
}
