import { AppConfig } from "@/config/type";
import { Roles } from "@/modules/auth/decorators/roles/roles.decorator";
import { NextAuthGuard } from "@/modules/auth/guards/next-auth/next-auth.guard";
import { OrganizationRolesGuard } from "@/modules/auth/guards/organization-roles/organization-roles.guard";
import { SubscribeToPlanInput } from "@/modules/billing/controllers/inputs/subscribe-to-plan.input";
import { CheckPlatformBillingResponseDto } from "@/modules/billing/controllers/outputs/CheckPlatformBillingResponse.dto";
import { SubscribeTeamToBillingResponseDto } from "@/modules/billing/controllers/outputs/SubscribeTeamToBillingResponse.dto";
import { BillingService } from "@/modules/billing/services/billing.service";
import { PlatformPlan } from "@/modules/billing/types";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { Stripe } from "stripe";

import { ApiResponse } from "@calcom/platform-types";

@Controller({
  path: "/billing",
  version: "2",
})
export class BillingController {
  private readonly stripeWhSecret: string;
  private logger = new Logger("Billing Controller");

  constructor(
    private readonly billingService: BillingService,
    private readonly configService: ConfigService<AppConfig>
  ) {
    this.stripeWhSecret = configService.get("stripe.webhookSecret", { infer: true }) ?? "";
  }

  @Get("/:teamId/check")
  @UseGuards(NextAuthGuard, OrganizationRolesGuard)
  @Roles(["OWNER", "ADMIN"])
  async checkTeamBilling(@Param("teamId") teamId: number): Promise<CheckPlatformBillingResponseDto> {
    const teamBilling = await this.billingService.getBillingData(teamId);

    return {
      status: "success",
      valid: teamBilling.status === "valid",
      plan: teamBilling.team?.platformBilling?.plan,
    };
  }

  @Post("/:teamId/subscribe")
  @UseGuards(NextAuthGuard, OrganizationRolesGuard)
  @Roles(["OWNER", "ADMIN"])
  async subscribeTeamToStripe(
    @Param("teamId") teamId: number,
    @Body() input: SubscribeToPlanInput
  ): Promise<SubscribeTeamToBillingResponseDto> {
    const { status } = await this.billingService.getBillingData(teamId);

    if (status === "valid") {
      throw new BadRequestException("This team is already subscribed to a plan.");
    }

    const { action, url } = await this.billingService.createSubscriptionForTeam(teamId, input.plan);
    if (action === "redirect") {
      return {
        status: "redirect",
        url,
      };
    }

    return {
      status: "success",
    };
  }

  @Post("/webhook")
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Req() request: Request,
    @Headers("stripe-signature") stripeSignature: string
  ): Promise<ApiResponse> {
    const event = await this.billingService.stripeService.stripe.webhooks.constructEventAsync(
      request.body,
      stripeSignature,
      this.stripeWhSecret
    );

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const teamId = Number.parseInt(subscription.metadata.teamId);
      const plan = subscription.metadata.plan;
      if (!plan || !teamId) {
        throw new Error("Invalid webhook received.");
      }

      await this.billingService.setSubscriptionForTeam(
        teamId,
        subscription,
        PlatformPlan[plan as keyof typeof PlatformPlan]
      );

      return {
        status: "success",
      };
    }

    throw new BadRequestException(`Unhandled event type ${event.type}`);
  }
}
