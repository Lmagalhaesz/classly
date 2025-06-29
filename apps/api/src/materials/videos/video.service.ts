import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVideoDto } from './dtos/create-video.dto';
import { UpdateVideoDto } from './dtos/update-video.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class VideoService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(VideoService.name)
    private readonly logger: PinoLogger,
  ) {}

  async validatePlaylistLevel(playlistId: string, videoLevel: string) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      throw new NotFoundException(`Playlist com id ${playlistId} não encontrada.`);
    }
    if (playlist.level !== videoLevel) {
      throw new BadRequestException('O nível do vídeo deve corresponder ao nível da playlist.');
    }
  }

  async create(createVideoDto: CreateVideoDto, teacherId: string) {
    if (createVideoDto.playlistId) {
      const playlist = await this.prisma.playlist.findUnique({
        where: { id: createVideoDto.playlistId },
      });

      if (!playlist || playlist.teacherId !== teacherId) {
        throw new BadRequestException('Você não tem permissão para usar essa playlist.');
      }

      if (playlist.level !== createVideoDto.level) {
        throw new BadRequestException('O nível do vídeo deve corresponder ao nível da playlist.');
      }
    }

    const video = await this.prisma.video.create({
      data: {
        title: createVideoDto.title,
        url: createVideoDto.url,
        description: createVideoDto.description,
        playlistId: createVideoDto.playlistId,
        level: createVideoDto.level,
        teacherId,
      },
    });

    this.logger.info({ videoId: video.id, teacherId }, 'Vídeo criado');
    return video;
  }

  async findAll(teacherId?: string, search?: string, page = 1, limit = 10) {
    const where = {
      deletedAt: null,
      ...(teacherId ? { teacherId } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.video.count({ where }),
    ]);

    return {
      total,
      page,
      perPage: limit,
      items,
    };
  }

  async findOne(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id, deletedAt: null },
    });
    if (!video) {
      throw new NotFoundException(`Vídeo com id ${id} não encontrado.`);
    }
    return video;
  }

  async update(id: string, updateVideoDto: UpdateVideoDto, teacherId: string) {
    const video = await this.findOne(id);
    if (video.teacherId !== teacherId) {
      throw new ForbiddenException('Você não tem permissão para editar este vídeo.');
    }

    if (updateVideoDto.playlistId && updateVideoDto.level) {
      const playlist = await this.prisma.playlist.findUnique({
        where: { id: updateVideoDto.playlistId },
      });
      if (!playlist || playlist.teacherId !== teacherId) {
        throw new BadRequestException('Playlist inválida ou não pertence a você.');
      }
      if (playlist.level !== updateVideoDto.level) {
        throw new BadRequestException('O nível do vídeo deve corresponder ao nível da playlist.');
      }
    }

    const updated = await this.prisma.video.update({
      where: { id },
      data: updateVideoDto,
    });

    this.logger.info({ videoId: id }, 'Vídeo atualizado');
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    const deleted = await this.prisma.video.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.logger.warn({ videoId: id }, 'Vídeo movido para lixeira');
    return deleted;
  }

  async restore(id: string) {
    const restored = await this.prisma.video.update({
      where: { id },
      data: { deletedAt: null },
    });
    this.logger.info({ videoId: id }, 'Vídeo restaurado');
    return restored;
  }

  async hardDelete(id: string) {
    await this.findOne(id);
    await this.prisma.video.delete({ where: { id } });
    this.logger.warn({ videoId: id }, 'Vídeo removido permanentemente');
    return { message: 'Vídeo deletado permanentemente.' };
  }
}
