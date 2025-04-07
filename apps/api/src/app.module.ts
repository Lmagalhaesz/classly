import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [PrismaModule, UserModule, AuthModule, LoggingModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
