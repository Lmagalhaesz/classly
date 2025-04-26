import { Injectable, NotFoundException, BadRequestException, LoggerService } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupInvitationDto } from './dtos/create-invitation.dto';
import { PinoLogger } from 'nestjs-pino';
import * as crypto from 'crypto';

@Injectable()
export class GroupInvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Gera um código de convite aleatório (8 caracteres padrão).
   */
  private generateInviteCode(length = 8): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
  }

  /**
   * Cria um convite para um grupo e retorna o link de acesso.
   * @param groupId ID do grupo que o convite irá pertencer
   * @param createDto DTO com dados opcionais, como validade do convite
   * @returns Objeto com o código de convite e o link para acesso
   */
  async createInvitation(groupId: string, createDto: CreateGroupInvitationDto) {
    const inviteCode = this.generateInviteCode();

    const invitation = await this.prisma.groupInvitation.create({
      data: {
        groupId,
        inviteCode,
        expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
      },
    });

    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join?inviteCode=${inviteCode}`;

    this.logger.info(
      {
        groupId,
        inviteCode,
        link,
      },
      'Convite de grupo criado com sucesso',
    );

    return {
      inviteCode,
      link,
    };
  }

  /**
   * Busca um convite pelo código e valida se está ativo e não expirado.
   * @param inviteCode Código do convite informado pelo aluno
   * @returns Dados do convite e do grupo relacionado
   */
  async useInvitation(inviteCode: string) {
    const invitation = await this.prisma.groupInvitation.findUnique({
      where: { inviteCode },
      include: { 
        group: {
          select: {
            id: true,
            name: true,
            level: true
          }
        } },
    });

    if (!invitation) {
      this.logger.warn({ inviteCode }, 'Tentativa de usar convite inexistente.');
      throw new NotFoundException('Convite não encontrado.');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      this.logger.warn({ inviteCode }, 'Tentativa de usar convite expirado.');
      throw new BadRequestException('O convite expirou.');
    }

    if (invitation.acceptedAt) {
      this.logger.warn({ inviteCode }, 'Tentativa de usar convite já aceito.');
      throw new BadRequestException('Este convite já foi utilizado.');
    }

    this.logger.info({ inviteCode }, 'Convite validado com sucesso.');
    return invitation;
  }

  /**
   * Marca o convite como aceito, preenchendo a data de aceitação.
   * @param inviteCode Código do convite aceito
   */
  async acceptInvitation(inviteCode: string) {
    const updatedInvitation = await this.prisma.groupInvitation.update({
      where: { inviteCode },
      data: {
        acceptedAt: new Date(),
      },
    });

    this.logger.info({ inviteCode }, 'Convite aceito e registrado.');
    return updatedInvitation;
  }
}
