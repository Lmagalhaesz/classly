import { Test, TestingModule } from '@nestjs/testing';
import { PlaylistService } from '../playlists/playlist.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Level } from '@prisma/client';

const playlistStub = {
  id: 'pl1',
  title: 'Playlist Teste',
  description: 'Uma descrição',
  level: Level.BASIC,
  teacherId: 'teacher1',
  deletedAt: null,
  createdAt: new Date(),
  videos: [],
};

describe('PlaylistService', () => {
  let service: PlaylistService;
  let prisma: any;
  let logger: any;

  beforeEach(async () => {
    prisma = {
      playlist: {
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
        PlaylistService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'PinoLogger:PlaylistService', useValue: logger },
      ],
    }).compile();

    service = module.get(PlaylistService);
  });

  describe('create', () => {
    it('deve criar playlist e logar', async () => {
      prisma.playlist.create.mockResolvedValue(playlistStub);
      const dto = { title: 'Playlist Teste', description: 'Uma descrição', level: Level.BASIC };
      const result = await service.create(dto, 'teacher1');
      expect(result).toEqual(playlistStub);
      expect(prisma.playlist.create).toBeCalledWith({
        data: {
          title: dto.title,
          description: dto.description,
          level: dto.level,
          teacherId: 'teacher1',
        },
      });
      expect(logger.info).toBeCalled();
    });
  });

  describe('findAll', () => {
    it('retorna paginado e filtrado', async () => {
      prisma.playlist.findMany.mockResolvedValue([playlistStub]);
      prisma.playlist.count.mockResolvedValue(1);
      const result = await service.findAll('teacher1', 'Teste', 1, 10);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('retorna todos sem filtro', async () => {
      prisma.playlist.findMany.mockResolvedValue([playlistStub]);
      prisma.playlist.count.mockResolvedValue(1);
      await service.findAll();
      expect(prisma.playlist.findMany).toBeCalled();
    });
  });

  describe('findOneOrThrow', () => {
    it('retorna playlist se existe e não está deletada', async () => {
      prisma.playlist.findUnique.mockResolvedValue(playlistStub);
      const result = await service.findOneOrThrow('pl1');
      expect(result).toEqual(playlistStub);
    });

    it('lança NotFoundException se não existe', async () => {
      prisma.playlist.findUnique.mockResolvedValue(null);
      await expect(service.findOneOrThrow('pl1')).rejects.toThrow(NotFoundException);
    });

    it('lança NotFoundException se deletada', async () => {
      prisma.playlist.findUnique.mockResolvedValue({ ...playlistStub, deletedAt: new Date() });
      await expect(service.findOneOrThrow('pl1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkOwnership', () => {
    it('retorna playlist se teacherId bate', async () => {
      service.findOneOrThrow = jest.fn().mockResolvedValue(playlistStub);
      const result = await service.checkOwnership('pl1', 'teacher1');
      expect(result).toEqual(playlistStub);
    });

    it('lança ForbiddenException se teacherId diferente', async () => {
      service.findOneOrThrow = jest.fn().mockResolvedValue({ ...playlistStub, teacherId: 'outro' });
      await expect(service.checkOwnership('pl1', 'teacher1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('atualiza playlist e loga', async () => {
      service.checkOwnership = jest.fn().mockResolvedValue(playlistStub);
      prisma.playlist.update.mockResolvedValue({ ...playlistStub, title: 'Nova' });
      const dto = { title: 'Nova' };
      const result = await service.update('pl1', dto, 'teacher1');
      expect(result.title).toBe('Nova');
      expect(logger.info).toBeCalled();
    });
  });

  describe('softDelete', () => {
    it('move para lixeira e loga', async () => {
      service.checkOwnership = jest.fn().mockResolvedValue(playlistStub);
      prisma.playlist.update.mockResolvedValue({ ...playlistStub, deletedAt: new Date() });
      const result = await service.softDelete('pl1', 'teacher1');
      expect(result.deletedAt).not.toBeNull();
      expect(logger.warn).toBeCalled();
    });
  });

  describe('restore', () => {
    it('restaura playlist e loga', async () => {
      prisma.playlist.findUnique.mockResolvedValue({ ...playlistStub, deletedAt: new Date() });
      prisma.playlist.update.mockResolvedValue({ ...playlistStub, deletedAt: null });
      const result = await service.restore('pl1', 'teacher1');
      expect(result.deletedAt).toBeNull();
      expect(logger.info).toBeCalled();
    });

    it('lança NotFoundException se não existe ou teacherId diferente', async () => {
      prisma.playlist.findUnique.mockResolvedValue(null);
      await expect(service.restore('pl1', 'teacher1')).rejects.toThrow(NotFoundException);

      prisma.playlist.findUnique.mockResolvedValue({ ...playlistStub, teacherId: 'outro' });
      await expect(service.restore('pl1', 'teacher1')).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException se já está ativa', async () => {
      prisma.playlist.findUnique.mockResolvedValue({ ...playlistStub, deletedAt: null });
      await expect(service.restore('pl1', 'teacher1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('hardDelete', () => {
    it('deleta permanentemente e loga', async () => {
      service.checkOwnership = jest.fn().mockResolvedValue(playlistStub);
      prisma.playlist.delete.mockResolvedValue(undefined);
      const result = await service.hardDelete('pl1', 'teacher1');
      expect(result).toEqual({ message: 'Playlist deletada permanentemente.' });
      expect(logger.warn).toBeCalled();
    });
  });
});
