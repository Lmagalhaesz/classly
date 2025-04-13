// src/playlist/playlist.controller.ts
import { Controller, Get, Post, Body, Put, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlaylistService } from './playlist.service';
import { CreatePlaylistDto } from './dtos/create-playlist.dto';
import { UpdatePlaylistDto } from './dtos/update-playlist.dto';
import { Request } from 'express';
import { TeacherGuard } from 'src/teacher/guards/teacher.guard';

@ApiTags('playlists')
@Controller('playlists')
@UseGuards(TeacherGuard)
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova playlist' })
  @ApiResponse({ status: 201, description: 'Playlist criada com sucesso.' })
  async create(@Body() createPlaylistDto: CreatePlaylistDto, @Req() req: Request) {
    const user = req.user as { userId: string };
    return this.playlistService.create(createPlaylistDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as playlists' })
  async findAll(@Req() req: Request) {
    const user = req.user as { userId: string, role: string };
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
