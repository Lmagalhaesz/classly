import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlaylistDto } from './dtos/create-playlist.dto';
import { UpdatePlaylistDto } from './dtos/update-playlist.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class PlaylistService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(PlaylistService.name)
    private readonly logger: PinoLogger,
  ) {}

  async create(dto: CreatePlaylistDto, teacherId: string) {
    const playlist = await this.prisma.playlist.create({
      data: {
        title: dto.title,
        description: dto.description,
        level: dto.level,
        teacherId,
      },
    });

    this.logger.info({ playlistId: playlist.id, teacherId }, 'Playlist criada');
    return playlist;
  }

  async findAll(teacherId?: string, search?: string, page = 1, limit = 10) {
    const where = {
      deletedAt: null,
      ...(teacherId ? { teacherId } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' as const} } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.playlist.findMany({
        where,
        include: { videos: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.playlist.count({ where }),
    ]);

    return {
      total,
      page,
      perPage: limit,
      items,
    };
  }

  async findOneOrThrow(id: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
      include: { videos: true },
    });

    if (!playlist || playlist.deletedAt) {
      throw new NotFoundException(`Playlist com id ${id} não encontrada.`);
    }

    return playlist;
  }

  async checkOwnership(id: string, teacherId: string) {
    const playlist = await this.findOneOrThrow(id);
    if (playlist.teacherId !== teacherId) {
      throw new ForbiddenException('Você não tem permissão para acessar essa playlist.');
    }
    return playlist;
  }

  async update(id: string, dto: UpdatePlaylistDto, teacherId: string) {
    await this.checkOwnership(id, teacherId);
    const updated = await this.prisma.playlist.update({
      where: { id },
      data: dto,
    });
    this.logger.info({ playlistId: id }, 'Playlist atualizada');
    return updated;
  }

  async softDelete(id: string, teacherId: string) {
    await this.checkOwnership(id, teacherId);
    const deleted = await this.prisma.playlist.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.logger.warn({ playlistId: id }, 'Playlist movida para lixeira');
    return deleted;
  }

  async restore(id: string, teacherId: string) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id } });
    if (!playlist || playlist.teacherId !== teacherId) {
      throw new NotFoundException('Playlist não encontrada ou acesso negado.');
    }

    if (!playlist.deletedAt) {
      throw new BadRequestException('A playlist já está ativa.');
    }

    const restored = await this.prisma.playlist.update({
      where: { id },
      data: { deletedAt: null },
    });

    this.logger.info({ playlistId: id }, 'Playlist restaurada');
    return restored;
  }

  async hardDelete(id: string, teacherId: string) {
    await this.checkOwnership(id, teacherId);
    await this.prisma.playlist.delete({ where: { id } });
    this.logger.warn({ playlistId: id }, 'Playlist deletada permanentemente');
    return { message: 'Playlist deletada permanentemente.' };
  }
}
