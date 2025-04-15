import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ChatInsightService } from './chat-insight.service';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TeacherGuard } from 'src/teacher/guards/teacher.guard';

@ApiTags('chat-insights')
@Controller('chat/insights')
@UseGuards(JwtAuthGuard, TeacherGuard)
export class ChatInsightController {
  constructor(private readonly chatInsightService: ChatInsightService) {}

  /**
   * Endpoint para gerar e salvar insights com base no histórico da conversa.
   * O token do usuário fornece o studentId.
   */
  @Get(':conversationId')
  @ApiOperation({ summary: 'Gera insights a partir do histórico de conversa e salva no banco' })
  @ApiResponse({ status: 200, description: 'Insights gerados com sucesso.' })
  async getInsights(@Param('conversationId') conversationId: string, @Req() req: Request): Promise<{ insight: string }> {
    const user = req.user as { userId: string };

    const insight = await this.chatInsightService.generateAndSaveInsights(conversationId, user.userId);
    return { insight };
  }
}
