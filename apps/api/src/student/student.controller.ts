import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { StudentGuard } from './guards/student.guard'; // se desejar usar para endpoints específicos
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('student')
@Controller('student')
@UseGuards(JwtAuthGuard, StudentGuard) 
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Retorna o dashboard do aluno' })
  @ApiResponse({ status: 200, description: 'Dashboard retornado com sucesso.' })
  getDashboard(@Req() req: Request) {
    return this.studentService.getDashboard(req);
  }
}
