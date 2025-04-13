/* import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PaymentGatewayService {
  private stripe: Stripe;

  constructor() {
    // Use sua chave secreta de teste ou produção do Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15',
    });
  }

  async createCheckoutSession(paymentInfo: { amount: number, currency: string, successUrl: string, cancelUrl: string }): Promise<string> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: paymentInfo.currency,
            product_data: {
              name: 'Pagamento Linfox',
            },
            unit_amount: paymentInfo.amount,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: paymentInfo.successUrl,
        cancel_url: paymentInfo.cancelUrl,
      });
      return session.url;
    } catch (error) {
      console.error('Erro ao criar session do Stripe:', error);
      throw new InternalServerErrorException('Não foi possível criar a sessão de pagamento.');
    }
  }

  // Você pode adicionar outros métodos para tratar webhooks e confirmar pagamentos.
}

*/
