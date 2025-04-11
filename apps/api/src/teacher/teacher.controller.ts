import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { TeacherGuard } from './guards/teacher.guard'; // se desejar usar para endpoints específicos
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('teacher')
@Controller('teacher')
@UseGuards(JwtAuthGuard, TeacherGuard) 
export class teacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Retorna o dashboard do aluno' })
  @ApiResponse({ status: 200, description: 'Dashboard retornado com sucesso.' })
  getDashboard(@Req() req: Request) {
    return this.teacherService.getDashboard(req);
  }
}
