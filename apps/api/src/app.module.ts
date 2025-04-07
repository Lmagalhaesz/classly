import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { LoggingModule } from './logging/logging.module';
import { GroupsModule } from './groups/groups.module';
import { PaymentsModule } from './payments/payments.module';
import { ActivitiesModule } from './activities/activities.module';
import { VideosModule } from './videos/videos.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { ChatInsightsModule } from './chat-insights/chat-insights.module';
import { AutomatedMessagesModule } from './automated-messages/automated-messages.module';
import { ChatService } from './chat/chat.service';
import { ChatController } from './chat/chat.controller';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [PrismaModule, UserModule, AuthModule, LoggingModule, GroupsModule, PaymentsModule, ActivitiesModule, VideosModule, PlaylistsModule, ChatInsightsModule, AutomatedMessagesModule, ChatModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class AppModule {}
