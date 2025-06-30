import { Test, TestingModule } from '@nestjs/testing';
import { PdfController } from '../pdfs/pdf.controller';
import { PdfMaterialService } from '../pdfs/pdf.service';
import { CreatePdfMaterialDto } from '../pdfs/dtos/create-pdf.dto';
import { UpdatePdfMaterialDto } from '../pdfs/dtos/update-pdf.dto';
import { Level } from '@prisma/client';

describe('PdfController', () => {
  let controller: PdfController;
  let service: PdfMaterialService;
  let logger: any;

  // Mock Request user
  const req = { user: { userId: 'teacher-1' } } as any;

  // Mock PDF model (prisma)
  const pdfMock = {
    id: '1',
    title: 'Teste',
    url: 'url.pdf',
    description: 'desc',
    playlistId: null,
    uploadedAt: new Date(),
    teacherId: 'teacher-1',
    level: Level.BASIC,
    deletedAt: null,
  };

  beforeEach(async () => {
    logger = { info: jest.fn(), warn: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfController],
      providers: [
        {
          provide: PdfMaterialService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            hardDelete: jest.fn(),
          },
        },
        // Mock PinoLogger for @InjectPinoLogger(PdfController.name)
        { provide: 'PinoLogger:PdfController', useValue: logger },
      ],
    }).compile();

    controller = module.get<PdfController>(PdfController);
    service = module.get<PdfMaterialService>(PdfMaterialService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('deve delegar a criação para o service', async () => {
      const dto: CreatePdfMaterialDto = {
        title: 'Teste',
        url: 'url.pdf',
        description: 'desc',
        level: Level.BASIC,
        playlistId: undefined,
      };
      jest.spyOn(service, 'create').mockResolvedValue(pdfMock);

      const result = await controller.create(dto, req);

      expect(service.create).toHaveBeenCalledWith(dto, req.user.userId);
      expect(result).toEqual(pdfMock);
    });
  });

  describe('findAll', () => {
    it('deve listar PDFs do professor', async () => {
      const items = [pdfMock, { ...pdfMock, id: '2' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(items as any);

      const result = await controller.findAll(req, 'search', 2, 5);

      expect(service.findAll).toHaveBeenCalledWith(
        req.user.userId,
        'search',
        2,
        5,
      );
      expect(result).toEqual(items);
    });
    it('deve listar PDFs com valores default de paginação', async () => {
      const items = [pdfMock];
      jest.spyOn(service, 'findAll').mockResolvedValue(items as any);

      const result = await controller.findAll(req);

      // Espera que tenha usado os defaults
      expect(service.findAll).toHaveBeenCalledWith(
        req.user.userId,
        undefined,
        1,
        10,
      );
      expect(result).toEqual(items);
    });
  });

  describe('findOne', () => {
    it('deve buscar PDF por ID', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(pdfMock);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(pdfMock);
    });
  });

  describe('update', () => {
    it('deve atualizar o PDF', async () => {
      const dto: UpdatePdfMaterialDto = { title: 'Novo Título' } as any;
      const updated = { ...pdfMock, ...dto };
      jest.spyOn(service, 'update').mockResolvedValue(updated);

      const result = await controller.update('1', dto, req);

      expect(service.update).toHaveBeenCalledWith('1', dto, req.user.userId);
      expect(result).toEqual(updated);
    });
  });

  describe('remove (softDelete)', () => {
    it('deve chamar softDelete', async () => {
      const deletedPdf = { ...pdfMock, deletedAt: new Date() };
      jest.spyOn(service, 'softDelete').mockResolvedValue(deletedPdf);

      const result = await controller.remove('1', req);

      expect(service.softDelete).toHaveBeenCalledWith('1', req.user.userId);
      expect(result).toEqual(deletedPdf);
    });
  });

  describe('restore', () => {
    it('deve chamar restore', async () => {
      const restored = { ...pdfMock, deletedAt: null };
      jest.spyOn(service, 'restore').mockResolvedValue(restored);

      const result = await controller.restore('1', req);

      expect(service.restore).toHaveBeenCalledWith('1', req.user.userId);
      expect(result).toEqual(restored);
    });
  });

  describe('hardDelete', () => {
    it('deve chamar hardDelete', async () => {
      jest
        .spyOn(service, 'hardDelete')
        .mockResolvedValue({ message: 'PDF deletado permanentemente.' });
      const result = await controller.hardDelete('1', req);

      expect(service.hardDelete).toHaveBeenCalledWith('1', req.user.userId);
      expect(result).toEqual({ message: 'PDF deletado permanentemente.' });
    });
  });
});
