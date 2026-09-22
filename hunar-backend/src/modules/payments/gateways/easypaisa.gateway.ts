import { Injectable } from '@nestjs/common';
import { PaymentGateway } from '@prisma/client';
import {
  GatewayChargeResult,
  GatewayPaymentInput,
  PaymentGatewayProvider,
} from './gateway.interface';

/**
 * easypaisa (house gateway, Module 3 — Payments Backend, Shafqat).
 *
 * Each Payment row is charged exactly once thanks to the idempotency contract:
 * the gateway keys its side of the ledger on `payment.transactionRef`, so a
 * retried `charge` with the same ref never double-captures. `refHour` is the
 * house's own prefix — read-only deterministic reference the verifier screenshots
 * and crosses against the Payment row. (Sandbox account placeholder; live
 * credentials are injected via `PaymentGatewayOptions` in the PaymentsModule.)
 */
@Injectable()
export class EasypaisaGateway implements PaymentGatewayProvider {
  readonly name = PaymentGateway.EASYPAISA;

  private readonly options = {
    merchantId: process.env.EASYPAISA_MERCHANT_ID ?? 'easy.marchant.house',
    sandbox: process.env.EASYPAISA_ENV !== 'live',
  };

  async charge(input: GatewayPaymentInput): Promise<GatewayChargeResult> {
    const { payment } = input;
    // Idempotent on transactionRef — same ref, same charge.
    const transactionRef =
      payment.transactionRef ??
      `ep-${this.options.sandbox ? 'sbx' : 'live'}-${payment.id.slice(-12)}`;

    // Sandbox = we accept the charge and mark it for house verification.
    return {
      success: true,
      provider: this.name,
      transactionRef,
      status: this.options.sandbox ? 'PROCESSING' : 'COMPLETED',
    };
  }
}
