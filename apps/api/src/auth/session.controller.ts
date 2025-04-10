// src/auth/session.controller.ts

import { Controller, Get, Delete, Param, UseGuards, Req, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt_auth.guard';

@ApiTags('sessions')
@Controller('auth/sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as sessões ativas do usuário' })
  @ApiResponse({ status: 200, description: 'Sessões retornadas com sucesso.' })
  async listSessions(@Req() req) {
    return this.authService.getUserSessions(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoga uma sessão específica do usuário' })
  @ApiResponse({ status: 200, description: 'Sessão revogada com sucesso.' })
  async revokeSession(@Param('id') sessionId: string, @Req() req) {
    return this.authService.revokeSession(req.user.userId, sessionId);
  }

  @Post('revokeall')
  @ApiOperation({ summary: 'Revoga todas as sessões ativas do usuário' })
  async revokeAll(@Req() req) {
    const userId = req.user.userId; // ou req.user.id, conforme sua implementação
    return this.authService.revokeAllSessions(userId);
  }
}
