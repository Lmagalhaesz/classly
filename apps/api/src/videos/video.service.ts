import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVideoDto } from './dtos/create-video.dto';
import { UpdateVideoDto } from './dtos/update-video.dto';

@Injectable()
export class VideoService {
  constructor(private readonly prisma: PrismaService) {}

  // Método para validar que o nível do vídeo é compatível com o nível da playlist
  async validatePlaylistLevel(playlistId: string, videoLevel: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) {
      throw new NotFoundException(`Playlist com id ${playlistId} não encontrada.`);
    }
    if (playlist.level !== videoLevel) {
      throw new BadRequestException('O nível do vídeo deve corresponder ao nível da playlist.');
    }
  }

  // Cria um novo vídeo, após validação (se playlistId for fornecido)
  async create(createVideoDto: CreateVideoDto, teacherId: string) {
    if (createVideoDto.playlistId) {
      await this.validatePlaylistLevel(createVideoDto.playlistId, createVideoDto.level);
    }
    return this.prisma.video.create({
      data: {
        title: createVideoDto.title,
        url: createVideoDto.url,
        description: createVideoDto.description,
        playlistId: createVideoDto.playlistId,
        level: createVideoDto.level,
        teacherId,
      },
    });
  }

  async findAll(teacherId?: string) {
    return this.prisma.video.findMany({
      where: teacherId ? { teacherId } : {},
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
    });
    if (!video) {
      throw new NotFoundException(`Vídeo com id ${id} não encontrado.`);
    }
    return video;
  }

  async update(id: string, updateVideoDto: UpdateVideoDto) {
    await this.findOne(id);
    if (updateVideoDto.playlistId && updateVideoDto.level) {
      await this.validatePlaylistLevel(updateVideoDto.playlistId, updateVideoDto.level);
    }
    return this.prisma.video.update({
      where: { id },
      data: updateVideoDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.video.delete({
      where: { id },
    });
  }
}
