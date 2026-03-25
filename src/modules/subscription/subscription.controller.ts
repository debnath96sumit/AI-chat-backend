import { Controller, Post, Body, UseGuards, Get, Res, Req, Headers, HttpStatus } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateCheckoutSessionDto } from './dto/subscription.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoginUser } from '@common/decorator/login-user.decorator';
import type { AuthenticatedUser } from '@auth/types/authenticated-user.type';
import { UserRole } from '@common/enum/user-role.enum';
import { Roles } from '@common/decorator/role.decorator';
import { RBAcGuard } from '@common/guards/rbac.guard';
import { StripeHelper } from '@helpers/stripe.helper';
import type { Request, Response } from "express";

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
    constructor(
        private readonly subscriptionService: SubscriptionService,
        private readonly stripeHelper: StripeHelper,
    ) { }

    @Get('plans')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async getPlans() {
        return this.subscriptionService.getPlans();
    }

    @Post("checkout")
    @Roles(UserRole.USER)
    @UseGuards(AuthGuard("jwt"), RBAcGuard)
    @ApiBearerAuth()
    @ApiConsumes("application/json")
    createCheckoutSession(
        @Body() dto: CreateCheckoutSessionDto,
        @LoginUser() user: AuthenticatedUser,
    ) {
        return this.subscriptionService.createCheckoutSession(dto, user);
    }

    @Post("cancel")
    @Roles(UserRole.USER)
    @UseGuards(AuthGuard("jwt"), RBAcGuard)
    @ApiBearerAuth()
    @ApiConsumes("application/json")
    async cancelSubscription(@LoginUser() user: AuthenticatedUser) {
        return this.subscriptionService.cancelSubscription(user);
    }

    @Get("me")
    @Roles(UserRole.USER)
    @UseGuards(AuthGuard("jwt"), RBAcGuard)
    @ApiBearerAuth()
    @ApiConsumes("application/json")
    async getMySubscription(@LoginUser() user: AuthenticatedUser) {
        return this.subscriptionService.getMySubscription(user);
    }

    @Post("webhook")
    async handleWebhook(
        @Headers("stripe-signature") signature: string,
        @Req() req: Request & { rawBody: Buffer },
        @Res() res: Response,
    ) {
        try {
            const event = this.stripeHelper.constructWebhookEvent(req.rawBody, signature);
            await this.subscriptionService.handleWebhook(event);
            return res.status(HttpStatus.OK).json({ received: true });
        } catch (err) {
            return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
        }
    }
}
