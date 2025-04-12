import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlaylistDto } from './dtos/create-playlist.dto';
import { UpdatePlaylistDto } from './dtos/update-playlist.dto';

@Injectable()
export class PlaylistService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPlaylistDto: CreatePlaylistDto, teacherId: string) {
    return this.prisma.playlist.create({
      data: {
        title: createPlaylistDto.title,
        description: createPlaylistDto.description,
        teacherId,
        level: createPlaylistDto.level,  // Inclua o level aqui
      },
    });
  }

  async findAll(teacherId?: string) {
    return this.prisma.playlist.findMany({
      where: teacherId ? { teacherId } : {},
      include: {
        videos: true,
      },
    });
  }

  async findOne(id: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
      include: {
        videos: true,
      },
    });
    if (!playlist) {
      throw new NotFoundException(`Playlist com id ${id} não encontrada.`);
    }
    return playlist;
  }

  async update(id: string, updatePlaylistDto: UpdatePlaylistDto) {
    await this.findOne(id);
    return this.prisma.playlist.update({
      where: { id },
      data: updatePlaylistDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.playlist.delete({
      where: { id },
    });
  }
}
