import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { CreatePlaylistDto } from './dtos/create-playlist.dto';
import { UpdatePlaylistDto } from './dtos/update-playlist.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt_auth.guard';
import { TeacherGuard } from 'src/teacher/guards/teacher.guard';
import { Request } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@ApiTags('Playlists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TeacherGuard)
@Controller('playlists')
export class PlaylistController {
  constructor(
    private readonly playlistService: PlaylistService,
    @InjectPinoLogger(PlaylistController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova playlist' })
  @ApiResponse({ status: 201, description: 'Playlist criada com sucesso.' })
  async create(@Body() dto: CreatePlaylistDto, @Req() req: Request) {
    const userId = (req.user as any).userId;
    const playlist = await this.playlistService.create(dto, userId);
    this.logger.info({ userId, playlistId: playlist.id }, 'Playlist criada');
    return playlist;
  }

  @Get()
  @ApiOperation({ summary: 'Listar playlists com filtros e paginação' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const userId = (req.user as any).userId;
    return this.playlistService.findAll(userId, search, Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma playlist por ID' })
  @ApiParam({ name: 'id', required: true })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.playlistService.checkOwnership(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar uma playlist' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlaylistDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;
    return this.playlistService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mover playlist para lixeira (soft delete)' })
  async softDelete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).userId;
    await this.playlistService.softDelete(id, userId);
  }

  @Put(':id/restore')
  @ApiOperation({ summary: 'Restaurar playlist da lixeira' })
  async restore(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.playlistService.restore(id, userId);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Excluir permanentemente a playlist (hard delete)' })
  async hardDelete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.playlistService.hardDelete(id, userId);
  }
}
