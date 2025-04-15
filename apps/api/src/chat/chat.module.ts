import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios'; // Se quiser usar HttpModule com axios (opcional)
import { ChatInsightController } from './chat-insight.controller';
import { ChatInsightService } from './chat-insight.service';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [ChatInsightController],
  providers: [ChatGateway, ChatService, ChatInsightService],
  exports: [ChatService],
})
export class ChatModule {}