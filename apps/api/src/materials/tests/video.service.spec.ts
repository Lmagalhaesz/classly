import { Test, TestingModule } from '@nestjs/testing';
import { VideoService } from '../videos/video.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Level } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

const videoStub = {
  id: 'vid1',
  title: 'Video Teste',
  url: 'http://video.com',
  description: 'Desc',
  playlistId: 'pl1',
  level: Level.BASIC,
  teacherId: 'teacher1',
  deletedAt: null,
  createdAt: new Date(),
};

const playlistStub = {
  id: 'pl1',
  level: Level.BASIC,
  teacherId: 'teacher1',
};

describe('VideoService', () => {
  let service: VideoService;
  let prisma: any;
  let logger: any;

  beforeEach(async () => {
    prisma = {
      playlist: { findUnique: jest.fn() },
      video: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    logger = { info: jest.fn(), warn: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'PinoLogger:VideoService', useValue: logger },
      ],
    }).compile();

    service = module.get(VideoService);
  });

  describe('validatePlaylistLevel', () => {
    it('deve lançar NotFoundException se playlist não encontrada', async () => {
      prisma.playlist.findUnique.mockResolvedValue(null);
      await expect(service.validatePlaylistLevel('id', Level.BASIC)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se level diferente', async () => {
      prisma.playlist.findUnique.mockResolvedValue({ ...playlistStub, level: Level.ADVANCED });
      await expect(service.validatePlaylistLevel('id', Level.BASIC)).rejects.toThrow(BadRequestException);
    });

    it('passa se level igual', async () => {
      prisma.playlist.findUnique.mockResolvedValue(playlistStub);
      await service.validatePlaylistLevel('pl1', Level.BASIC);
      expect(prisma.playlist.findUnique).toBeCalled();
    });
  });

  describe('create', () => {
    const baseDto = {
      title: 'Novo',
      url: 'http://video.com',
      description: 'Desc',
      level: Level.BASIC,
      playlistId: 'pl1',
    };

    it('cria vídeo quando playlistId não informado', async () => {
      prisma.video.create.mockResolvedValue(videoStub);
      const dto = { ...baseDto, playlistId: undefined };
      const result = await service.create(dto, 'teacher1');
      expect(result).toEqual(videoStub);
      expect(logger.info).toBeCalled();
    });

    it('deve lançar se playlist não existe ou não pertence ao teacher', async () => {
      prisma.playlist.findUnique.mockResolvedValue({ teacherId: 'other', level: Level.BASIC });
      await expect(service.create(baseDto, 'teacher1')).rejects.toThrow(BadRequestException);
    });

    it('deve lançar se playlist.level diferente', async () => {
      prisma.playlist.findUnique.mockResolvedValue({ ...playlistStub, level: Level.ADVANCED });
      await expect(service.create(baseDto, 'teacher1')).rejects.toThrow(BadRequestException);
    });

    it('cria vídeo se playlist válida', async () => {
      prisma.playlist.findUnique.mockResolvedValue(playlistStub);
      prisma.video.create.mockResolvedValue(videoStub);
      const result = await service.create(baseDto, 'teacher1');
      expect(result).toEqual(videoStub);
      expect(logger.info).toBeCalled();
    });
  });

  describe('findAll', () => {
    it('retorna lista de vídeos filtrando por teacher/search', async () => {
      prisma.video.findMany.mockResolvedValue([videoStub]);
      prisma.video.count.mockResolvedValue(1);
      const result = await service.findAll('teacher1', 'Teste', 1, 10);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('retorna lista sem filtros', async () => {
      prisma.video.findMany.mockResolvedValue([videoStub]);
      prisma.video.count.mockResolvedValue(1);
      await service.findAll();
      expect(prisma.video.findMany).toBeCalled();
    });
  });

  describe('findOne', () => {
    it('retorna vídeo se existe', async () => {
      prisma.video.findUnique.mockResolvedValue(videoStub);
      const result = await service.findOne('vid1');
      expect(result).toEqual(videoStub);
    });

    it('deve lançar NotFoundException se não existe', async () => {
      prisma.video.findUnique.mockResolvedValue(null);
      await expect(service.findOne('id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      title: 'atualizado',
      url: 'nova-url',
      level: Level.BASIC,
    };

    it('deve lançar Forbidden se não é o teacher', async () => {
      service.findOne = jest.fn().mockResolvedValue({ ...videoStub, teacherId: 'other' });
      await expect(service.update('vid1', updateDto, 'teacher1')).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar BadRequest se playlistId/level inválidos', async () => {
      service.findOne = jest.fn().mockResolvedValue(videoStub);
      prisma.playlist.findUnique.mockResolvedValue(null);
      await expect(service.update('vid1', { ...updateDto, playlistId: 'id' }, 'teacher1')).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequest se playlist.level diferente', async () => {
      service.findOne = jest.fn().mockResolvedValue(videoStub);
      prisma.playlist.findUnique.mockResolvedValue({ ...playlistStub, level: Level.ADVANCED });
      await expect(service.update('vid1', { ...updateDto, playlistId: 'id', level: Level.BASIC }, 'teacher1')).rejects.toThrow(BadRequestException);
    });

    it('atualiza vídeo se tudo válido', async () => {
      service.findOne = jest.fn().mockResolvedValue(videoStub);
      prisma.video.update.mockResolvedValue({ ...videoStub, title: 'atualizado' });
      const result = await service.update('vid1', updateDto, 'teacher1');
      expect(result.title).toBe('atualizado');
      expect(logger.info).toBeCalled();
    });
  });

  describe('remove', () => {
    it('remove (soft delete) vídeo', async () => {
      service.findOne = jest.fn().mockResolvedValue(videoStub);
      prisma.video.update.mockResolvedValue({ ...videoStub, deletedAt: new Date() });
      const result = await service.remove('vid1');
      expect(result.deletedAt).not.toBeNull();
      expect(logger.warn).toBeCalled();
    });
  });

  describe('restore', () => {
    it('restaura vídeo', async () => {
      prisma.video.update.mockResolvedValue({ ...videoStub, deletedAt: null });
      const result = await service.restore('vid1');
      expect(result.deletedAt).toBeNull();
      expect(logger.info).toBeCalled();
    });
  });

  describe('hardDelete', () => {
    it('deleta permanentemente vídeo', async () => {
      service.findOne = jest.fn().mockResolvedValue(videoStub);
      prisma.video.delete.mockResolvedValue(undefined);
      const result = await service.hardDelete('vid1');
      expect(result).toEqual({ message: 'Vídeo deletado permanentemente.' });
      expect(logger.warn).toBeCalled();
    });
  });
});
