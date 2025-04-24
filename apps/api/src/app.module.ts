import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { PaymentsModule } from './payments/payments.module';
import { ActivityModule } from './activities/activities.module';
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
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { VideoModule } from './videos/video.module';
import { PlaylistModule } from './playlists/playlist.module';
import { TaskAttemptModule } from './task-attempts/task-attempt.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: "/uploads" 
    }),
    ConfigModule.forRoot({
      isGlobal: true,  // Faz as configurações estarem disponíveis globalmente
      load: [configuration], // Carrega o arquivo de configuração
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            translateTime: 'HH:MM:ss.l',
          },
        },
        autoLogging: true, // loga cada request automaticamente
      },
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    GroupsModule,
    PaymentsModule,
    ActivityModule,
    VideoModule,
    PlaylistModule,
    AutomatedMessagesModule,
    ChatModule,
    TeacherModule,
    StudentModule,
    TaskAttemptModule,
  ],
  controllers: [ChatController, StudentController],
  providers: [ChatService, StudentService],
})
export class AppModule {}
