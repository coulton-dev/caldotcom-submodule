import { getEnv } from "@/env";
import { AuthModule } from "@/modules/auth/auth.module";
import { OAuthClientUsersController } from "@/modules/endpoints/oauth-clients/controllers/oauth-client-users/oauth-client-users.controller";
import { OAuthClientsController } from "@/modules/endpoints/oauth-clients/controllers/oauth-clients/oauth-clients.controller";
import { OAuthFlowController } from "@/modules/endpoints/oauth-clients/controllers/oauth-flow/oauth-flow.controller";
import { OAuthClientGuard } from "@/modules/endpoints/oauth-clients/guards/oauth-client/oauth-client.guard";
import { OAuthClientRepository } from "@/modules/endpoints/oauth-clients/oauth-client.repository";
import { OAuthFlowService } from "@/modules/endpoints/oauth-clients/services/oauth-flow.service";
import { MembershipModule } from "@/modules/repositories/membership/membership.module";
import { TokensRepository } from "@/modules/repositories/tokens/tokens.repository";
import { UserModule } from "@/modules/repositories/user/user.module";
import { PrismaModule } from "@/modules/services/prisma/prisma.module";
import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

@Global()
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    MembershipModule,
    JwtModule.register({ secret: getEnv("JWT_SECRET") }),
  ],
  providers: [OAuthClientRepository, OAuthClientGuard, TokensRepository, OAuthFlowService],
  controllers: [OAuthClientsController, OAuthClientUsersController, OAuthFlowController],
  exports: [OAuthClientRepository, OAuthClientGuard],
})
export class OAuthClientModule {}
