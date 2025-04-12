// src/chat/chat.controller.ts
import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversation')
  @ApiOperation({ summary: 'Cria uma nova conversa para o usuário' })
  @ApiResponse({ status: 201, description: 'Conversa criada com sucesso.' })
  async createConversation(@Req() req: Request): Promise<{ conversationId: string }> {
    const user = req.user as { userId: string };
    const conversation = await this.chatService.createConversation(user.userId);
    return { conversationId: conversation.id };
  }
}
