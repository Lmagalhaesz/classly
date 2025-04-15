import { Controller, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { TaskAttemptService } from './task-attempt.service';
import { CreateTaskAttemptDto } from './dto/create-task-attempt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { StudentGuard } from '../student/guards/student.guard'; // Se você tiver um guard específico para estudantes
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('task-attempts')
@Controller('task-attempts')
@UseGuards(JwtAuthGuard, StudentGuard)
export class TaskAttemptController {
  constructor(private readonly taskAttemptService: TaskAttemptService) {}

  @Post()
  @ApiOperation({ summary: 'Registra uma tentativa de atividade do aluno' })
  @ApiResponse({ status: 201, description: 'Tentativa registrada com sucesso.' })
  async createAttempt(@Body() createTaskAttemptDto: CreateTaskAttemptDto, @Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    return this.taskAttemptService.createAttempt(createTaskAttemptDto, user.userId);
  }
}