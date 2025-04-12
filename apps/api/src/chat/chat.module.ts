import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios'; // Se quiser usar HttpModule com axios (opcional)

@Module({
  imports: [PrismaModule, HttpModule],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}