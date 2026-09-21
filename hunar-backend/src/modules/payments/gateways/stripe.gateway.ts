import { ForbiddenException, Injectable } from '@nestjs/common';
import { PaymentGateway, PaymentStatus } from '@prisma/client';
import {
  GatewayChargeResult,
  GatewayPaymentInput,
  PaymentGatewayProvider,
} from './gateway.interface';

/**
 * Stripe (house gateway, Module 3 — Payments Backend, Shafqat) — CARD / uah
 * method, tokens resolved by `stripe` in the PaymentsModule DI container.
 *
 * Stripe charges complete asynchronously (webhook -> payment intent), so the
 * gateway returns PROCESSING and the charge is flipped to COMPLETED only when
 * the house (verifier) confirms the payment intent — same workflow as the local
 * gateways, same idempotency key on `payment.transactionRef`.
 */
@Injectable()
export class StripeGateway implements PaymentGatewayProvider {
  readonly name = PaymentGateway.STRIPE;

  private readonly options = {
    apiKey: process.env.STRIPE_SECRET_KEY ?? 'pk_test_house_placeholder',
    sandbox: process.env.STRIPE_ENV !== 'live',
  };

  async charge(input: GatewayPaymentInput): Promise<GatewayChargeResult> {
    const { payment } = input;

    // House marker: Stripe charges on the customer's card, always a real capture.
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new ForbiddenException('Stripe: cannot charge a refunded payment');
    }

    const transactionRef =
      payment.transactionRef ??
      `pi_${this.options.sandbox ? 'sbx' : 'live'}_${payment.id.slice(-12)}`;

    return {
      success: true,
      provider: this.name,
      transactionRef,
      status: 'PROCESSING',
    };
  }
}
