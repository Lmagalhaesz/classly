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
  Patch,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { CreateVideoDto } from './dtos/create-video.dto';
import { UpdateVideoDto } from './dtos/update-video.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt_auth.guard';
import { TeacherGuard } from 'src/teacher/guards/teacher.guard';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@ApiTags('Vídeos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TeacherGuard)
@Controller('videos')
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    @InjectPinoLogger(VideoController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo vídeo' })
  @ApiResponse({ status: 201, description: 'Vídeo criado com sucesso' })
  async create(@Body() dto: CreateVideoDto, @Req() req: Request) {
    const userId = (req.user as any).userId;
    const video = await this.videoService.create(dto, userId);
    this.logger.info({ videoId: video.id, userId }, 'Vídeo criado');
    return video;
  }

  @Get()
  @ApiOperation({ summary: 'Listar vídeos do professor' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.videoService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um vídeo por ID' })
  @ApiParam({ name: 'id', required: true })
  async findOne(@Param('id') id: string) {
    return this.videoService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um vídeo existente' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVideoDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;
    const updated = await this.videoService.update(id, dto, userId);
    this.logger.info({ videoId: id, userId }, 'Vídeo atualizado');
    return updated;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mover vídeo para a lixeira (soft delete)' })
  async softDelete(@Param('id') id: string) {
    await this.videoService.remove(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restaurar vídeo da lixeira' })
  async restore(@Param('id') id: string) {
    return this.videoService.restore(id);
  }

  @Delete(':id/hard')
  @ApiOperation({ summary: 'Excluir vídeo permanentemente (hard delete)' })
  async hardDelete(@Param('id') id: string) {
    return this.videoService.hardDelete(id);
  }
}
