// src/playlist/playlist.controller.ts
import { Controller, Get, Post, Body, Put, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlaylistService } from './playlist.service';
import { CreatePlaylistDto } from './dtos/create-playlist.dto';
import { UpdatePlaylistDto } from './dtos/update-playlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { Request } from 'express';

@ApiTags('playlists')
@Controller('playlists')
@UseGuards(JwtAuthGuard)
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova playlist' })
  @ApiResponse({ status: 201, description: 'Playlist criada com sucesso.' })
  async create(@Body() createPlaylistDto: CreatePlaylistDto, @Req() req: Request) {
    // Extraia o teacherId do usuário autenticado
    const user = req.user as { userId: string };
    return this.playlistService.create(createPlaylistDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as playlists' })
  async findAll(@Req() req: Request) {
    // Se desejar, filtre as playlists pelo professor autenticado
    const user = req.user as { userId: string, role: string };
    // Se o professor está autenticado, pode retornar somente suas playlists.
    return this.playlistService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna os detalhes de uma playlist pelo id' })
  async findOne(@Param('id') id: string) {
    return this.playlistService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma playlist pelo id' })
  async update(@Param('id') id: string, @Body() updatePlaylistDto: UpdatePlaylistDto) {
    return this.playlistService.update(id, updatePlaylistDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma playlist pelo id' })
  async remove(@Param('id') id: string) {
    return this.playlistService.remove(id);
  }
}
