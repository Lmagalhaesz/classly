import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  Patch,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GroupInvitationService } from './group-invitation.service';
import { CreateGroupInvitationDto } from './dtos/create-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBadRequestResponse, ApiConflictResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { GroupService } from './groups.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { format } from 'date-fns';

@ApiTags('group-invitations')
@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupInvitationController {

  constructor(
    private readonly invitationService: GroupInvitationService,
    private readonly groupService: GroupService,
  ) {}


  /**
   * Gera um convite para a turma. Somente usuários com a role 'TEACHER' ou 'ADMIN' podem realizar essa ação.
   * Verifica se o convite já existe antes de criar um novo.
   */
  @Roles(Role.TEACHER, Role.ADMIN)
  @Post(':groupId/invite')
  @ApiOperation({ summary: 'Gera um convite para a turma' })
  @ApiResponse({
    status: 201,
    description: 'Convite gerado com sucesso.',
    schema: {
      example: {
        statusCode: 201,
        message: 'Convite gerado com sucesso.',
        inviteCode: 'ABC123',
        link: 'http://localhost:3000/join?inviteCode=ABC123',
        expiresAt: '31/12/2025 23:59',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos na requisição.' })
  @ApiConflictResponse({ description: 'Já existe um convite ativo para este grupo.' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno no servidor.' })
  async createInvitation(
    @Param('groupId') groupId: string,
    @Body() createDto: CreateGroupInvitationDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string; role: string };

    // Verifica se o usuário tem permissão para gerar convites
    if (user.role !== Role.TEACHER && user.role !== Role.ADMIN) {
      throw new BadRequestException('Apenas professores ou administradores podem gerar convites.');
    }


    try {
      // Verificação de campo obrigatório
      const expiresAt = createDto.expiresAt;
      if (!expiresAt) {
        throw new BadRequestException('O campo "expiresAt" é obrigatório.');
      }

      // Formatação da data expiresAt
      const formattedExpiresAt = format(new Date(expiresAt), 'dd/MM/yyyy HH:mm');

      // Cria o convite
      const invitation = await this.invitationService.createInvitation(groupId, createDto);

      return {
        statusCode: 201,
        message: 'Convite gerado com sucesso.',
        inviteCode: invitation.inviteCode,
        link: invitation.link,
        expiresAt: formattedExpiresAt,
      };
    } catch (error) {
      // Tratamento de exceções específicas
      if (error instanceof ConflictException) {
        throw new ConflictException('Já existe um convite ativo para este grupo.');
      }
      throw new InternalServerErrorException('Erro interno no servidor. Tente novamente mais tarde.');
    }
  }


  /**
   * Aceita o convite para a turma e adiciona o aluno ao grupo. O convite deve ser válido e não expirado.
   * Se o convite não for encontrado, retorna um erro 404.
   */
  @Patch(':inviteCode/accept')
  @ApiOperation({ summary: 'Aceita o convite e adiciona o aluno ao grupo' })
  @ApiResponse({
    status: 200,
    description: 'Convite aceito e aluno adicionado ao grupo.',
    schema: {
      example: {
        message: 'Convite aceito e aluno adicionado ao grupo com sucesso!',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Convite inválido ou expirado.' })
  @ApiNotFoundResponse({ description: 'Convite não encontrado.' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno no servidor.' })
  async acceptInvitation(
    @Param('inviteCode') inviteCode: string,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string };

    try {
      // Verifica a validade do convite
      const invitation = await this.invitationService.useInvitation(inviteCode);

      // Adiciona o aluno ao grupo
      await this.groupService.addStudent(invitation.groupId, user.userId);

      // Marca o convite como aceito
      await this.invitationService.acceptInvitation(inviteCode);

      return { message: 'Convite aceito e aluno adicionado ao grupo com sucesso!' };
    } catch (error) {
      throw new InternalServerErrorException('Erro interno ao aceitar o convite.');
    }
  }
}
