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
import { TeacherModule } from './teacher/teacher.module';
import { StudentService } from './student/student.service';
import { StudentController } from './student/student.controller';
import { StudentModule } from './student/student.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // Faz as configurações estarem disponíveis globalmente
      load: [configuration], // Carrega o arquivo de configuração
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    LoggingModule,
    GroupsModule,
    PaymentsModule,
    ActivitiesModule,
    VideosModule,
    PlaylistsModule,
    ChatInsightsModule,
    AutomatedMessagesModule,
    ChatModule,
    TeacherModule,
    StudentModule,
  ],
  controllers: [ChatController, StudentController],
  providers: [ChatService, StudentService],
})
export class AppModule {}
