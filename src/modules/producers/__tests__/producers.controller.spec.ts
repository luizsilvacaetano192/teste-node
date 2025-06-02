import { Test, TestingModule } from '@nestjs/testing';
import { ProducersController } from '../producers.controller';
import { ProducersService } from '../producers.service';
import { CreateProducerDto, DocumentType } from '../dto/create-producer.dto';
import { UpdateProducerDto } from '../dto/update-producer.dto';
import { ProducerResponseDto } from '../dto/producer-response.dto';
import { Pagination } from 'nestjs-typeorm-paginate';

describe('ProducersController', () => {
  let controller: ProducersController;
  let service: ProducersService;

  const mockProducerEntity = {
    id: '1',
    name: 'Luiz Silva Caetano',
    documentNumber: '32314319800',
    documentType: DocumentType.CPF,
  };

  const mockProducerResponseDto = new ProducerResponseDto(mockProducerEntity);

  const mockPaginationResult: Pagination<any> = {
    items: [mockProducerEntity],
    meta: { totalItems: 1, itemCount: 1, itemsPerPage: 10, totalPages: 1, currentPage: 1 },
    links: { first: '', previous: '', next: '', last: '' },
  };

  const producersServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    searchByName: jest.fn(),
    findByDocumentType: jest.fn(),
    findByDocument: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProducersController],
      providers: [{ provide: ProducersService, useValue: producersServiceMock }],
    }).compile();

    controller = module.get<ProducersController>(ProducersController);
    service = module.get<ProducersService>(ProducersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a producer and return ProducerResponseDto', async () => {
      const dto: CreateProducerDto = {
        name: 'Luiz Silva Caetano',
        documentNumber: '32314319800',
        documentType: DocumentType.CPF,
      };
      producersServiceMock.create.mockResolvedValue(mockProducerEntity);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockProducerResponseDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated producers', async () => {
      producersServiceMock.findAll.mockResolvedValue(mockPaginationResult);

      const result = await controller.findAll(1, 10);

      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result.items[0]).toBeInstanceOf(ProducerResponseDto);
      expect(result.meta).toEqual(mockPaginationResult.meta);
      expect(result.links).toEqual(mockPaginationResult.links);
    });
  });

  describe('findOne', () => {
    it('should return a producer by id', async () => {
      producersServiceMock.findOne.mockResolvedValue(mockProducerEntity);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockProducerResponseDto);
    });
  });

  describe('update', () => {
    it('should update and return updated producer', async () => {
      const updateDto: UpdateProducerDto = {
        name: 'Luiz Caetano',
        documentNumber: '47194877007',
        documentType: DocumentType.CPF,
      };
      producersServiceMock.update.mockResolvedValue({ ...mockProducerEntity, ...updateDto });

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toBeInstanceOf(ProducerResponseDto);
      expect(result.name).toEqual(updateDto.name);
    });
  });

  describe('remove', () => {
    it('should remove the producer', async () => {
      producersServiceMock.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toBeUndefined();
    });
  });

  describe('searchByName', () => {
    it('should return list of producers filtered by name', async () => {
      producersServiceMock.searchByName.mockResolvedValue([mockProducerEntity]);

      const result = await controller.searchByName('Luiz');

      expect(service.searchByName).toHaveBeenCalledWith('Luiz');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBeInstanceOf(ProducerResponseDto);
    });
  });

  describe('findByDocumentType', () => {
    it('should return producers filtered by document type', async () => {
      producersServiceMock.findByDocumentType.mockResolvedValue([mockProducerEntity]);

      const result = await controller.findByDocumentType(DocumentType.CPF);

      expect(service.findByDocumentType).toHaveBeenCalledWith(DocumentType.CPF);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBeInstanceOf(ProducerResponseDto);
    });
  });

  describe('findByDocument', () => {
    it('should return producers filtered by document type and number', async () => {
      producersServiceMock.findByDocument.mockResolvedValue([mockProducerEntity]);

      const result = await controller.findByDocument(DocumentType.CPF, '32314319800');

      expect(service.findByDocument).toHaveBeenCalledWith(DocumentType.CPF, '32314319800');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBeInstanceOf(ProducerResponseDto);
    });
  });
});
