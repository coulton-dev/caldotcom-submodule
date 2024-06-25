import { MembershipsRepository } from "@/modules/memberships/memberships.repository";
import { OrganizationsTeamsController } from "@/modules/organizations/controllers/organizations-teams.controller";
import { OrganizationsController } from "@/modules/organizations/controllers/organizations.controller";
import { OrganizationsRepository } from "@/modules/organizations/organizations.repository";
import { OrganizationUsersRepository } from "@/modules/organizations/repositories/organization-users.repository";
import { OrganizationsService } from "@/modules/organizations/services/organizations.service";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { StripeModule } from "@/modules/stripe/stripe.module";
import { Module } from "@nestjs/common";

@Module({
  imports: [PrismaModule, StripeModule],
  providers: [
    OrganizationsRepository,
    OrganizationsService,
    OrganizationUsersRepository,
    MembershipsRepository,
  ],
  exports: [OrganizationsService, OrganizationsRepository],
  controllers: [OrganizationsController, OrganizationsTeamsController],
})
export class OrganizationsModule {}
