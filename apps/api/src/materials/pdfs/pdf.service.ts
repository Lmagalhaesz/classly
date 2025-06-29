import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePdfMaterialDto } from './dtos/create-pdf.dto';
import { UpdatePdfMaterialDto } from './dtos/update-pdf.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class PdfMaterialService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(PdfMaterialService.name)
    private readonly logger: PinoLogger,
  ) {}

  private async checkOwnership(id: string, teacherId: string) {
    const material = await this.prisma.pdfMaterial.findUnique({ where: { id } });
    if (!material || material.deletedAt) {
      throw new NotFoundException('PDF não encontrado.');
    }
    if (material.teacherId !== teacherId) {
      throw new ForbiddenException('Você não tem permissão para acessar este PDF.');
    }
    return material;
  }

  async create(dto: CreatePdfMaterialDto, teacherId: string) {
    if (dto.playlistId) {
      const playlist = await this.prisma.playlist.findUnique({
        where: { id: dto.playlistId },
      });

      if (!playlist || playlist.teacherId !== teacherId) {
        throw new BadRequestException('Playlist inválida ou não pertence a você.');
      }

      if (playlist.level !== dto.level) {
        throw new BadRequestException('O nível do PDF deve corresponder ao nível da playlist.');
      }
    }

    const created = await this.prisma.pdfMaterial.create({
      data: {
        title: dto.title,
        url: dto.url,
        description: dto.description,
        level: dto.level,
        teacherId,
        playlistId: dto.playlistId,
      },
    });

    this.logger.info({ pdfId: created.id, teacherId }, 'PDF criado');
    return created;
  }

  async findAll(teacherId?: string, search?: string, page = 1, limit = 10) {
    const where = {
      deletedAt: null,
      ...(teacherId ? { teacherId } : {}),
      ...(search
        ? { title: { contains: search, mode: 'insensitive' as const } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.pdfMaterial.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
      }),
      this.prisma.pdfMaterial.count({ where }),
    ]);

    return {
      total,
      page,
      perPage: limit,
      items,
    };
  }

  async findOne(id: string) {
    const material = await this.prisma.pdfMaterial.findUnique({
      where: { id },
    });

    if (!material || material.deletedAt) {
      throw new NotFoundException('PDF não encontrado.');
    }

    return material;
  }

  async update(id: string, dto: UpdatePdfMaterialDto, teacherId: string) {
    const existing = await this.checkOwnership(id, teacherId);

    if (dto.playlistId && dto.level) {
      const playlist = await this.prisma.playlist.findUnique({
        where: { id: dto.playlistId },
      });

      if (!playlist || playlist.teacherId !== teacherId) {
        throw new BadRequestException('Playlist inválida ou não pertence a você.');
      }

      if (playlist.level !== dto.level) {
        throw new BadRequestException('O nível do PDF deve corresponder ao nível da playlist.');
      }
    }

    const updated = await this.prisma.pdfMaterial.update({
      where: { id },
      data: dto,
    });

    this.logger.info({ pdfId: id }, 'PDF atualizado');
    return updated;
  }

  async softDelete(id: string, teacherId: string) {
    await this.checkOwnership(id, teacherId);

    const deleted = await this.prisma.pdfMaterial.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.warn({ pdfId: id }, 'PDF movido para lixeira');
    return deleted;
  }

  async restore(id: string, teacherId: string) {
    const material = await this.prisma.pdfMaterial.findUnique({ where: { id } });

    if (!material || material.teacherId !== teacherId) {
      throw new NotFoundException('PDF não encontrado ou acesso negado.');
    }

    if (!material.deletedAt) {
      throw new BadRequestException('O PDF já está ativo.');
    }

    const restored = await this.prisma.pdfMaterial.update({
      where: { id },
      data: { deletedAt: null },
    });

    this.logger.info({ pdfId: id }, 'PDF restaurado');
    return restored;
  }

  async hardDelete(id: string, teacherId: string) {
    await this.checkOwnership(id, teacherId);

    await this.prisma.pdfMaterial.delete({ where: { id } });

    this.logger.warn({ pdfId: id }, 'PDF deletado permanentemente');
    return { message: 'PDF deletado permanentemente.' };
  }
}
