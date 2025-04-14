import { Module } from '@nestjs/common';
import { GroupController } from './groups.controller';
import { GroupService } from './groups.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GroupInvitationService } from './group-invitation.service';

@Module({
  imports: [PrismaModule],
  controllers: [GroupController],
  providers: [GroupService, GroupInvitationService],
  exports: [GroupService, GroupInvitationService],
})
export class GroupsModule {}