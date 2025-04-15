import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { StudentGuard } from './guards/student.guard';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JoinGroupDto } from '../groups/dtos/join-group.dto';
import { GroupInvitationService } from 'src/groups/group-invitation.service';
import { GroupService } from 'src/groups/groups.service';

@ApiTags('student')
@Controller('student')
@UseGuards(JwtAuthGuard, StudentGuard) 
export class StudentController {
  constructor(private readonly studentService: StudentService, 
    private readonly groupInvitationService: GroupInvitationService,
    private readonly groupService: GroupService) {}

    @Get('dashboard')
    @ApiOperation({ summary: 'Retorna o dashboard do aluno, incluindo estatísticas de desempenho.' })
    @ApiResponse({ status: 200, description: 'Dashboard retornado com sucesso.' })
    async getDashboard(@Req() req: Request) {
      const user = req.user as { userId: string };
      const stats = await this.studentService.getPerformanceStats(user.userId);
      return {
        message: 'Dashboard do aluno',
        performanceStats: stats,
      };
    }

  @Post('join')
  @ApiOperation({ summary: 'Aluno usa o código de convite para ingressar em uma turma' })
  @ApiResponse({ status: 200, description: 'Aluno ingressou na turma com sucesso.' })
  async joinGroup(@Body() joinDto: JoinGroupDto, @Req() req: Request) {

    const user = req.user as { userId: string; role: string };

    const invitation = await this.groupInvitationService.useInvitation(joinDto.inviteCode);
    
    await this.groupService.addStudent(invitation.groupId, user.userId);

    await this.groupInvitationService.acceptInvitation(joinDto.inviteCode);
    return { message: 'Você entrou na turma com sucesso!', groupId: invitation.groupId };
  }

}
