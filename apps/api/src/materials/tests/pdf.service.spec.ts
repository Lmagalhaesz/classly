import { Test, TestingModule } from '@nestjs/testing';
import { PdfMaterialService } from '../pdfs/pdf.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Level } from '@prisma/client';

const pdfStub = {
  id: 'pdf1',
  title: 'PDF Teste',
  url: 'http://pdf.com',
  description: 'Desc',
  playlistId: 'pl1',
  level: Level.BASIC,
  teacherId: 'teacher1',
  deletedAt: null,
  uploadedAt: new Date(),
};

const playlistStub = {
  id: 'pl1',
  level: Level.BASIC,
  teacherId: 'teacher1',
};

describe('PdfMaterialService', () => {
  let service: PdfMaterialService;
  let prisma: any;
  let logger: any;

  beforeEach(async () => {
    prisma = {
      pdfMaterial: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      playlist: { findUnique: jest.fn() },
    };
    logger = { info: jest.fn(), warn: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfMaterialService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'PinoLogger:PdfMaterialService', useValue: logger },
      ],
    }).compile();

    service = module.get(PdfMaterialService);
  });

  describe('checkOwnership', () => {
    it('lança NotFound se não existe ou deletado', async () => {
      prisma.pdfMaterial.findUnique.mockResolvedValueOnce(null);
      await expect(
        service['checkOwnership']('pdf1', 'teacher1'),
      ).rejects.toThrow(NotFoundException);
      prisma.pdfMaterial.findUnique.mockResolvedValueOnce({
        ...pdfStub,
        deletedAt: new Date(),
      });
      await expect(
        service['checkOwnership']('pdf1', 'teacher1'),
      ).rejects.toThrow(NotFoundException);
    });
    it('lança Forbidden se teacherId diferente', async () => {
      prisma.pdfMaterial.findUnique.mockResolvedValue({
        ...pdfStub,
        teacherId: 'other',
      });
      await expect(
        service['checkOwnership']('pdf1', 'teacher1'),
      ).rejects.toThrow(ForbiddenException);
    });
    it('retorna se ownership OK', async () => {
      prisma.pdfMaterial.findUnique.mockResolvedValue(pdfStub);
      const result = await service['checkOwnership']('pdf1', 'teacher1');
      expect(result).toEqual(pdfStub);
    });
  });

  describe('create', () => {
    const dto = { ...pdfStub, title: 'Novo' };
    it('cria PDF sem playlist', async () => {
      prisma.pdfMaterial.create.mockResolvedValue(pdfStub);
      const input = { ...dto, playlistId: undefined };
      const result = await service.create(input, 'teacher1');
      expect(result).toEqual(pdfStub);
      expect(logger.info).toBeCalled();
    });
    it('lança BadRequest se playlist não existe ou não pertence', async () => {
      prisma.playlist.findUnique.mockResolvedValueOnce(null);
      await expect(service.create(dto, 'teacher1')).rejects.toThrow(
        BadRequestException,
      );
      prisma.playlist.findUnique.mockResolvedValueOnce({ teacherId: 'other' });
      await expect(service.create(dto, 'teacher1')).rejects.toThrow(
        BadRequestException,
      );
    });
    it('lança BadRequest se playlist.level diferente', async () => {
      prisma.playlist.findUnique.mockResolvedValueOnce({
        ...playlistStub,
        level: Level.ADVANCED,
      });
      await expect(service.create(dto, 'teacher1')).rejects.toThrow(
        BadRequestException,
      );
    });
    it('cria PDF se playlist OK', async () => {
      prisma.playlist.findUnique.mockResolvedValue(playlistStub);
      prisma.pdfMaterial.create.mockResolvedValue(pdfStub);
      const result = await service.create(dto, 'teacher1');
      expect(result).toEqual(pdfStub);
      expect(logger.info).toBeCalled();
    });
  });

  describe('findAll', () => {
    it('lista PDFs com filtro', async () => {
      prisma.pdfMaterial.findMany.mockResolvedValue([pdfStub]);
      prisma.pdfMaterial.count.mockResolvedValue(1);
      const result = await service.findAll('teacher1', 'Teste', 2, 5);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
    it('lista PDFs sem filtro', async () => {
      prisma.pdfMaterial.findMany.mockResolvedValue([pdfStub]);
      prisma.pdfMaterial.count.mockResolvedValue(1);
      await service.findAll();
      expect(prisma.pdfMaterial.findMany).toBeCalled();
    });
  });

  describe('findOne', () => {
    it('retorna PDF se existe', async () => {
      prisma.pdfMaterial.findUnique.mockResolvedValue(pdfStub);
      const result = await service.findOne('pdf1');
      expect(result).toEqual(pdfStub);
    });
    it('lança NotFound se não existe ou deletado', async () => {
      prisma.pdfMaterial.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('pdf1')).rejects.toThrow(NotFoundException);
      prisma.pdfMaterial.findUnique.mockResolvedValueOnce({
        ...pdfStub,
        deletedAt: new Date(),
      });
      await expect(service.findOne('pdf1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('lança BadRequest se playlistId/level inválidos', async () => {
      service['checkOwnership'] = jest.fn().mockResolvedValue(pdfStub);
      prisma.playlist.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.update(
          'pdf1',
          { playlistId: 'id', level: Level.BASIC },
          'teacher1',
        ),
      ).rejects.toThrow(BadRequestException);
      prisma.playlist.findUnique.mockResolvedValueOnce({ teacherId: 'other' });
      await expect(
        service.update(
          'pdf1',
          { playlistId: 'id', level: Level.BASIC },
          'teacher1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
    it('lança BadRequest se playlist.level diferente', async () => {
      service['checkOwnership'] = jest.fn().mockResolvedValue(pdfStub);
      prisma.playlist.findUnique.mockResolvedValueOnce({
        ...playlistStub,
        level: Level.ADVANCED,
      });
      await expect(
        service.update(
          'pdf1',
          { playlistId: 'id', level: Level.BASIC },
          'teacher1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
    it('atualiza PDF se tudo válido', async () => {
      service['checkOwnership'] = jest.fn().mockResolvedValue(pdfStub);
      prisma.pdfMaterial.update.mockResolvedValue({
        ...pdfStub,
        title: 'Novo',
      });
      const result = await service.update(
        'pdf1',
        { title: 'Novo' },
        'teacher1',
      );
      expect(result.title).toBe('Novo');
      expect(logger.info).toBeCalled();
    });
  });

  describe('softDelete', () => {
    it('soft delete PDF', async () => {
      jest.spyOn(service, 'softDelete').mockResolvedValue(undefined);
      const result = await service.softDelete('id', 'teacherId');
      expect(result).toBeUndefined();
    });
    it('deve lançar NotFoundException se PDF não existir no softDelete', async () => {
    jest.spyOn(service, 'checkOwnership').mockRejectedValue(new NotFoundException());

    await expect(service.softDelete('pdfid', 'teacherid')).rejects.toThrow(NotFoundException);
  });

  it('deve lançar ForbiddenException se não for owner no softDelete', async () => {
    jest.spyOn(service, 'checkOwnership').mockRejectedValue(new ForbiddenException());

    await expect(service.softDelete('pdfid', 'teacherid')).rejects.toThrow(ForbiddenException);
  });
  });

  describe('restore', () => {
    it('restaura PDF', async () => {
      prisma.pdfMaterial.findUnique.mockResolvedValueOnce({
        ...pdfStub,
        deletedAt: new Date(),
      });
      prisma.pdfMaterial.update.mockResolvedValue({
        ...pdfStub,
        deletedAt: null,
      });
      const result = await service.restore('pdf1', 'teacher1');
      expect(result.deletedAt).toBeNull();
      expect(logger.info).toBeCalled();
    });
    it('lança NotFound se não existe ou teacherId diferente', async () => {
      prisma.pdfMaterial.findUnique.mockResolvedValueOnce(null);
      await expect(service.restore('pdf1', 'teacher1')).rejects.toThrow(
        NotFoundException,
      );
      prisma.pdfMaterial.findUnique.mockResolvedValueOnce({
        ...pdfStub,
        teacherId: 'other',
        deletedAt: new Date(),
      });
      await expect(service.restore('pdf1', 'teacher1')).rejects.toThrow(
        NotFoundException,
      );
    });
    it('lança BadRequest se já está ativo', async () => {
      prisma.pdfMaterial.findUnique.mockResolvedValueOnce(pdfStub);
      await expect(service.restore('pdf1', 'teacher1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('hardDelete', () => {
    it('hard delete PDF', async () => {
      service['checkOwnership'] = jest.fn().mockResolvedValue(pdfStub);
      prisma.pdfMaterial.delete.mockResolvedValue(undefined);
      const result = await service.hardDelete('pdf1', 'teacher1');
      expect(result).toEqual({ message: 'PDF deletado permanentemente.' });
      expect(logger.warn).toBeCalled();
    });
  });
});
