import { Controller, Post, Body, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { GroupInvitationService } from './group-invitation.service';
import { CreateGroupInvitationDto } from './dtos/create-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TeacherGuard } from 'src/teacher/guards/teacher.guard';

@ApiTags('group-invitations')
@Controller('groups')
@UseGuards(JwtAuthGuard, TeacherGuard)
export class GroupInvitationController {
  constructor(private readonly invitationService: GroupInvitationService) {}

  @Post(':groupId/invite')
  @ApiOperation({ summary: 'Gera um convite para a turma' })
  @ApiResponse({ status: 201, description: 'Convite gerado com sucesso.' })
  async createInvitation(
    @Param('groupId') groupId: string,
    @Body() createDto: CreateGroupInvitationDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string; role: string };
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new BadRequestException('Apenas professores ou administradores podem gerar convites.');
    }

    return this.invitationService.createInvitation(groupId, createDto);
  }
}
