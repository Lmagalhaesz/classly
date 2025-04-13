import { Controller, Post, UploadedFile, UseInterceptors, Body, Req, BadRequestException, Get, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateVideoDto } from './dtos/create-video.dto';
import { UpdateVideoDto } from './dtos/update-video.dto';
import { diskStorage } from 'multer';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VideoService } from './video.service';
import { TeacherGuard } from 'src/teacher/guards/teacher.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt_auth.guard';

@ApiTags('videos')
@Controller('videos')
@UseGuards(TeacherGuard, JwtAuthGuard)
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Faz o upload de um vídeo e cria seu registro' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
         const filename = uniqueSuffix + '-' + file.originalname;
         callback(null, filename);
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.startsWith('video/')) {
         return callback(new BadRequestException('Apenas arquivos de vídeo são permitidos.'), false);
      }
      callback(null, true);
    },
  }))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() createVideoDto: CreateVideoDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string, role: string };
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new BadRequestException('Apenas professores podem fazer upload de vídeos.');
    }
    
    const baseUrl = 'http://localhost:3000'; 
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;
    
    createVideoDto.url = fileUrl;
    
    return this.videoService.create(createVideoDto, user.userId);
  }


  @Get()
  @ApiOperation({ summary: 'Lista todos os vídeos' })
  async findAll(@Req() req: Request) {
    const user = req.user as { userId: string, role: string };
    return this.videoService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna os detalhes de um vídeo pelo id' })
  async findOne(@Param('id') id: string) {
    return this.videoService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um vídeo pelo id' })
  async update(@Param('id') id: string, @Body() updateVideoDto: UpdateVideoDto) {
    return this.videoService.update(id, updateVideoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um vídeo pelo id' })
  async remove(@Param('id') id: string) {
    return this.videoService.remove(id);
  }
}
