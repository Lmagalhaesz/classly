import { Test, TestingModule } from '@nestjs/testing';
import { VideoController } from '../videos/video.controller';
import { VideoService } from '../videos/video.service';
import { CreateVideoDto } from '../videos/dtos/create-video.dto';
import { UpdateVideoDto } from '../videos/dtos/update-video.dto';
import { PinoLogger } from 'nestjs-pino';
import { Level } from '@prisma/client';

const videoStub = {
  id: 'vid1',
  title: 'Test Video',
  url: 'http://test.com',
  description: 'desc',
  playlistId: 'pl1',
  level: Level.BASIC,
  teacherId: 'teacher1',
  deletedAt: null,
  createdAt: new Date(),
};

describe('VideoController', () => {
  let controller: VideoController;
  let service: any;
  let logger: any;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      restore: jest.fn(),
      hardDelete: jest.fn(),
    };
    logger = { info: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [
        { provide: VideoService, useValue: service },
        { provide: 'PinoLogger:VideoController', useValue: logger },
      ],
    }).compile();

    controller = module.get(VideoController);
  });

  describe('create', () => {
    it('deve criar vídeo e logar', async () => {
      service.create.mockResolvedValue(videoStub);
      const req: any = { user: { userId: 'teacher1' } };
      const dto: CreateVideoDto = {
        title: 'Test Video',
        url: 'http://test.com',
        description: 'desc',
        playlistId: 'pl1',
        level: Level.BASIC,
      };
      const result = await controller.create(dto, req);
      expect(service.create).toBeCalledWith(dto, 'teacher1');
      expect(logger.info).toBeCalled();
      expect(result).toEqual(videoStub);
    });
  });

  describe('findAll', () => {
    it('deve buscar todos vídeos do professor', async () => {
      service.findAll.mockResolvedValue([videoStub]);
      const req: any = { user: { userId: 'teacher1' } };
      const result = await controller.findAll(req);
      expect(service.findAll).toBeCalledWith('teacher1');
      expect(result).toEqual([videoStub]);
    });
  });

  describe('findOne', () => {
    it('deve buscar vídeo por id', async () => {
      service.findOne.mockResolvedValue(videoStub);
      const result = await controller.findOne('vid1');
      expect(service.findOne).toBeCalledWith('vid1');
      expect(result).toEqual(videoStub);
    });
  });

  describe('update', () => {
    it('deve atualizar vídeo e logar', async () => {
      service.update.mockResolvedValue({ ...videoStub, title: 'Atualizado' });
      const req: any = { user: { userId: 'teacher1' } };
      const dto: UpdateVideoDto = {
        title: 'Atualizado',
        url: 'http://test.com',
        level: Level.BASIC,
      };
      const result = await controller.update('vid1', dto, req);
      expect(service.update).toBeCalledWith('vid1', dto, 'teacher1');
      expect(logger.info).toBeCalled();
      expect(result.title).toBe('Atualizado');
    });
  });

  describe('softDelete', () => {
    it('deve mover vídeo pra lixeira', async () => {
      service.remove.mockResolvedValue(undefined);
      await controller.softDelete('vid1');
      expect(service.remove).toBeCalledWith('vid1');
    });
  });

  describe('restore', () => {
    it('deve restaurar vídeo', async () => {
      service.restore.mockResolvedValue({ ...videoStub, deletedAt: null });
      const result = await controller.restore('vid1');
      expect(service.restore).toBeCalledWith('vid1');
      expect(result.deletedAt).toBeNull();
    });
  });

  describe('hardDelete', () => {
    it('deve remover vídeo permanentemente', async () => {
      service.hardDelete.mockResolvedValue({ message: 'Vídeo deletado permanentemente.' });
      const result = await controller.hardDelete('vid1');
      expect(service.hardDelete).toBeCalledWith('vid1');
      expect(result).toEqual({ message: 'Vídeo deletado permanentemente.' });
    });
  });
});
