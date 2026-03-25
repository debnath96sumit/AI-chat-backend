import { BadRequestException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { SubscriptionPlanRepository } from './repositories/subscription-plan.repository';
import { ApiResponse } from '@common/types/api-response.type';
import { AuthenticatedUser } from '@auth/types/authenticated-user.type';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { StripeHelper } from '@helpers/stripe.helper';
import { CreateCheckoutSessionDto } from './dto/subscription.dto';
import { UserRepository } from '@modules/user/repositories/user.repository';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Types } from 'mongoose';
import { MailerService } from '@helpers/mailer.helper';

@Injectable()
export class SubscriptionService {
    constructor(
        @Inject("StripeToken") private readonly stripe: Stripe,
        private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly stripeHelper: StripeHelper,
        private readonly userRepository: UserRepository,
        private readonly configService: ConfigService,
        private readonly mailService: MailerService,
    ) { }

    async getPlans(): Promise<ApiResponse> {
        const plans = await this.subscriptionPlanRepository.getAll({
            isActive: true,
        })

        return {
            statusCode: plans.length > 0 ? HttpStatus.OK : HttpStatus.NOT_FOUND,
            message: plans.length > 0 ? 'Plans fetched successfully' : 'No plans found',
            data: plans,
        }
    }

    async getMySubscription(user: AuthenticatedUser): Promise<ApiResponse> {
        const subscriptionDetails =
            await this.subscriptionRepository.getAllSubscriptions(user._id);

        return {
            statusCode: HttpStatus.OK,
            message: "Subscription details fetched successfully",
            data: subscriptionDetails ?? [],
        };
    }

    async cancelSubscription(user: AuthenticatedUser): Promise<ApiResponse> {
        if (!user._id) {
            throw new BadRequestException("User not found.");
        }

        const subscription = await this.subscriptionRepository.getByField({
            userId: user._id,
            status: { $in: ["active", "trialing", "past_due"] },
            isDeleted: false,
        });

        if (!subscription) {
            throw new BadRequestException("No active subscription found to cancel.");
        }

        if (subscription.cancelAtPeriodEnd) {
            throw new BadRequestException(
                "Your subscription is already set to cancel at the end of the current period.",
            );
        }

        const stripeSubscription = await this.stripeHelper.cancelSubscription(
            subscription.stripeSubscriptionId as string,
        );

        if (!stripeSubscription) {
            throw new BadRequestException("Subscription cancellation failed.");
        }

        await this.subscriptionRepository.updateByField(
            { cancelAtPeriodEnd: true, canceledBy: 'user' },
            { stripeSubscriptionId: subscription.stripeSubscriptionId },
        );

        return {
            statusCode: HttpStatus.OK,
            message:
                "Your subscription will be cancelled at the end of the current billing period.",
        };
    }

    async createCheckoutSession(dto: CreateCheckoutSessionDto, user: AuthenticatedUser): Promise<ApiResponse> {
        const plan = await this.subscriptionPlanRepository.getByField({
            _id: dto.planId,
            isActive: true,
            tier: "pro",
        });
        if (!plan) throw new BadRequestException("Plan not found");

        const existing = await this.subscriptionRepository.getByField({
            userId: user._id,
            status: { $in: ["active", "trialing", "past_due", "incomplete"] },
        });
        if (existing) throw new BadRequestException("You already have an active subscription");

        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await this.stripeHelper.createCustomer(user.fullName, user.email);
            if (!customer) throw new BadRequestException("Failed to create customer");
            await this.userRepository.updateById({ stripeCustomerId: customer.id }, user._id)
        }

        const session = await this.stripeHelper.createSubscriptionCheckout({
            userId: user._id.toString(),
            planId: plan._id.toString(),
            stripeCustomerId,
            stripePriceId: plan.stripePriceId,
            successUrl: `${this.configService.get("FRONTEND_URL")}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${this.configService.get("FRONTEND_URL")}/subscription/cancel`
        });

        if (!session) throw new BadRequestException("Failed to create checkout session");

        return {
            statusCode: HttpStatus.OK,
            message: "Checkout session created successfully",
            data: { url: session.url },
        };
    }

    async handleWebhook(event: Stripe.Event): Promise<void> {
        switch (event.type) {
            case "checkout.session.completed": {
                try {
                    await this.handleCheckoutSession(event.data.object as Stripe.Checkout.Session);
                } catch (error) {
                    console.error("Error handling checkout session:", error);
                }
                break;
            }

            case "customer.subscription.created": {
                try {
                    await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
                } catch (error) {
                    console.error("Error handling subscription created:", error);
                }
                break;
            }
            case "customer.subscription.deleted":
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            default:
                break;
        }
    }
    private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
        await this.subscriptionRepository.updateByField(
            {
                status: stripeSubscription.status,
                cancelAtPeriodEnd: false,
                canceledBy: 'system',
            },
            { stripeSubscriptionId: stripeSubscription.id },
        );
    }

    private async handleCheckoutSession(session: Stripe.Checkout.Session) {
        const stripeSubscription = await this.stripe.subscriptions.retrieve(
            session.subscription as string,
            { expand: ["default_payment_method"] },
        );

        const item = stripeSubscription.items.data[0];

        const user = await this.userRepository.getByField({
            _id: new Types.ObjectId(session.metadata?.userId as string),
        });
        if (!user) throw new BadRequestException("User not found");

        const subscription = await this.subscriptionRepository.save({
            userId: user._id,
            subscriptionPlanId: new Types.ObjectId(session.metadata?.planId as string),
            stripeSubscriptionId: stripeSubscription.id,
            stripeCustomerId: stripeSubscription.customer as string,
            status: stripeSubscription.status,
            currentPeriodEnd: new Date(item.current_period_end * 1000),
        });

        const locals = {
            userName: user.firstName,
            endDate: subscription.currentPeriodEnd,
            dashboardUrl: `${this.configService.getOrThrow<string>("FRONTEND_URL")}/new`,
            year: new Date().getFullYear(),
        };
        await this.mailService.sendMail(
            user.email,
            "Your AI Pasta Subscription Has Been Activated",
            "plan-purchased",
            locals,
        );
    }

    private async handleSubscriptionCreated(stripeSubscription: Stripe.Subscription) {
        const exists = await this.subscriptionRepository.getByField({
            stripeSubscriptionId: stripeSubscription.id,
        });
        if (exists) return;

        console.warn("Subscription created outside checkout, no metadata available:", stripeSubscription.id);
    }
}
