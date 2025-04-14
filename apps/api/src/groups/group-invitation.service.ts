import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupInvitationDto } from './dtos/create-invitation.dto';
import * as crypto from 'crypto';

@Injectable()
export class GroupInvitationService {
  constructor(private readonly prisma: PrismaService) {}

  // Função para gerar um código de convite único (por exemplo, 8 caracteres)
  private generateInviteCode(length = 8): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
  }

  async createInvitation(groupId: string, createDto: CreateGroupInvitationDto) {
    const code = this.generateInviteCode();
    return this.prisma.groupInvitation.create({
      data: {
        groupId,
        inviteCode: code,
        expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
      },
    });
  }

  // Permite recuperar um convite e verificar sua validade
  async useInvitation(inviteCode: string) {
    const invitation = await this.prisma.groupInvitation.findUnique({
      where: { inviteCode },
      include: { group: true },
    });
    if (!invitation) {
      throw new NotFoundException('Convite não encontrado.');
    }
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new BadRequestException('O convite expirou.');
    }
    if (invitation.acceptedAt) {
      throw new BadRequestException('Este convite já foi utilizado.');
    }
    return invitation;
  }

  // Registra o uso do convite, marcando-o como aceito
  async acceptInvitation(inviteCode: string) {
    return this.prisma.groupInvitation.update({
      where: { inviteCode },
      data: {
        acceptedAt: new Date(),
      },
    });
  }
}
