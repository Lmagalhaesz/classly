import { Test, TestingModule } from '@nestjs/testing';
import { PlaylistController } from '../playlists/playlist.controller';
import { PlaylistService } from '../playlists/playlist.service';
import { PinoLogger } from 'nestjs-pino';
import { CreatePlaylistDto } from '../playlists/dtos/create-playlist.dto';
import { UpdatePlaylistDto } from '../playlists/dtos/update-playlist.dto';
import { Level } from '@prisma/client';

const playlistStub = {
  id: 'pl1',
  title: 'Playlist Teste',
  description: 'Descrição',
  level: Level.BASIC,
  teacherId: 'teacher1',
  deletedAt: null,
  createdAt: new Date(),
  videos: [],
};

describe('PlaylistController', () => {
  let controller: PlaylistController;
  let playlistService: any;
  let logger: any;

  beforeEach(async () => {
    playlistService = {
      create: jest.fn(),
      findAll: jest.fn(),
      checkOwnership: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      hardDelete: jest.fn(),
    };
    logger = { info: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaylistController],
      providers: [
        { provide: PlaylistService, useValue: playlistService },
        { provide: 'PinoLogger:PlaylistController', useValue: logger },
      ],
    }).compile();

    controller = module.get<PlaylistController>(PlaylistController);
  });

  function mockReq(userId = 'teacher1') {
    return { user: { userId } } as any;
  }

  describe('create', () => {
    it('deve criar playlist e logar', async () => {
      playlistService.create.mockResolvedValue(playlistStub);
      const dto: CreatePlaylistDto = {
        title: 'Playlist Teste',
        description: 'Descrição',
        level: Level.BASIC,
      };
      const req = mockReq();
      const result = await controller.create(dto, req);
      expect(result).toEqual(playlistStub);
      expect(playlistService.create).toBeCalledWith(dto, 'teacher1');
      expect(logger.info).toBeCalled();
    });
  });

  describe('findAll', () => {
    it('deve listar playlists do teacher', async () => {
      playlistService.findAll.mockResolvedValue({
        items: [playlistStub],
        total: 1,
      });
      const req = mockReq();
      const result = await controller.findAll(req, 'Teste', 2, 15);
      expect(result.items).toHaveLength(1);
      expect(playlistService.findAll).toBeCalledWith(
        'teacher1',
        'Teste',
        2,
        15,
      );
    });

    it('converte page e limit para number', async () => {
      playlistService.findAll.mockResolvedValue({ items: [], total: 0 });
      const req = mockReq();
      await controller.findAll(req, undefined, '1' as any, '5' as any);
      expect(playlistService.findAll).toBeCalledWith(
        'teacher1',
        undefined,
        1,
        5,
      );
    });

    it('deve listar playlists com valores padrão de paginação', async () => {
      const req = mockReq();
      const resultMock = { items: [], total: 0, page: 1, perPage: 10 };
      playlistService.findAll.mockResolvedValue(resultMock);

      const result = await controller.findAll(req);

      expect(playlistService.findAll).toHaveBeenCalledWith(
        'teacher1',
        undefined,
        1,
        10,
      );
      expect(result).toEqual(resultMock);
    });
  });

  describe('findOne', () => {
    it('deve buscar playlist e validar ownership', async () => {
      playlistService.checkOwnership.mockResolvedValue(playlistStub);
      const req = mockReq();
      const result = await controller.findOne('pl1', req);
      expect(result).toEqual(playlistStub);
      expect(playlistService.checkOwnership).toBeCalledWith('pl1', 'teacher1');
    });
  });

  describe('update', () => {
    it('deve atualizar playlist', async () => {
      playlistService.update.mockResolvedValue({
        ...playlistStub,
        title: 'Nova',
      });
      const req = mockReq();
      const dto: UpdatePlaylistDto = { title: 'Nova' } as any;
      const result = await controller.update('pl1', dto, req);
      expect(result.title).toBe('Nova');
      expect(playlistService.update).toBeCalledWith('pl1', dto, 'teacher1');
    });
  });

  describe('softDelete', () => {
    it('deve mover playlist para lixeira', async () => {
      playlistService.softDelete.mockResolvedValue(undefined);
      const req = mockReq();
      await expect(controller.softDelete('pl1', req)).resolves.toBeUndefined();
      expect(playlistService.softDelete).toBeCalledWith('pl1', 'teacher1');
    });
  });

  describe('restore', () => {
    it('deve restaurar playlist', async () => {
      playlistService.restore.mockResolvedValue({
        ...playlistStub,
        deletedAt: null,
      });
      const req = mockReq();
      const result = await controller.restore('pl1', req);
      expect(result.deletedAt).toBeNull();
      expect(playlistService.restore).toBeCalledWith('pl1', 'teacher1');
    });
  });

  describe('hardDelete', () => {
    it('deve hard delete playlist', async () => {
      playlistService.hardDelete.mockResolvedValue({
        message: 'Playlist deletada permanentemente.',
      });
      const req = mockReq();
      const result = await controller.hardDelete('pl1', req);
      expect(result).toEqual({ message: 'Playlist deletada permanentemente.' });
      expect(playlistService.hardDelete).toBeCalledWith('pl1', 'teacher1');
    });
  });
});
