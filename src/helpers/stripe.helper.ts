import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Types } from "mongoose";
import { UserRepository } from "@modules/user/repositories/user.repository";
import Stripe from "stripe";

interface createSubscriptionCheckout {
  userId: string;
  planId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  successUrl: string;
  cancelUrl: string;
}
@Injectable()
export class StripeHelper {
  constructor(
    @Inject("StripeToken") private readonly stripe: Stripe,
    private configService: ConfigService,
    private userRepository: UserRepository,
  ) { }

  /**
   * @Method createCustomer
   * @Description Creates a new customer in Stripe.
   */
  async createCustomer(name: string, email: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        name: name,
        email: email,
      });
      return customer;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async createSubscriptionCheckout(data: createSubscriptionCheckout) {
    try {
      const { userId, planId, stripeCustomerId, stripePriceId, successUrl, cancelUrl } = data;
      const session = await this.stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          planId
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      return session;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async cancelSubscription(
    stripeSubscriptionId: string,
  ): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.update(
        stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        },
      );
      return subscription;
    } catch (error) {
      console.error("Error canceling subscription:", error);
      return null;
    }
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.getOrThrow<string>("STRIPE_WEBHOOK_SECRET");
    try {
      return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }
  }
}
