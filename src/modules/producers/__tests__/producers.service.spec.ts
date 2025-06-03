import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Not, SelectQueryBuilder } from 'typeorm';
import { ProducersService } from '../producers.service';
import { Producer } from '../entities/producer.entity';
import { CreateProducerDto, DocumentType } from '../dto/create-producer.dto';
import { UpdateProducerDto } from '../dto/update-producer.dto';
import { ProducerResponseDto } from '../dto/producer-response.dto';
import { RedisService } from '../../redis/redis.service';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { LoggerService } from '../../../shared/logger/logger.service';
import { Farm } from '../../farms/entities/farm.entity';
import { paginate } from 'nestjs-typeorm-paginate';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ILike } from 'typeorm';

jest.mock('nestjs-typeorm-paginate', () => ({
  paginate: jest.fn().mockImplementation((queryBuilder, options) => ({
    items: [{
      id: '1',
      name: 'Test Producer',
      documentNumber: '52998224725',
      documentType: DocumentType.CPF,
      farms: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }],
    meta: {
      totalItems: 1,
      itemCount: 1,
      itemsPerPage: options.limit,
      totalPages: 1,
      currentPage: options.page,
    },
    links: {
      first: '',
      previous: '',
      next: '',
      last: '',
    },
  })),
}));

describe('ProducersService', () => {
  let service: ProducersService;
  let producerRepository: Repository<Producer>;
  let redisService: RedisService;
  let loggerService: LoggerService;

  const mockProducer: Producer = {
    id: '1',
    name: 'Test Producer',
    documentNumber: '52998224725',
    documentType: DocumentType.CPF,
    farms: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFarm: Farm = {
    id: 'farm1',
    name: 'Test Farm',
    city: 'Test City',
    state: 'SP',
    totalArea: 100,
    arableArea: 50,
    vegetationArea: 50,
    crops: [],
    producer: mockProducer
  };

  const mockProducerResponseDto = new ProducerResponseDto(mockProducer);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducersService,
        {
          provide: getRepositoryToken(Producer),
          useValue: {
            create: jest.fn().mockReturnValue(mockProducer),
            save: jest.fn().mockResolvedValue(mockProducer),
            findOne: jest.fn().mockImplementation((options) => {
              if (options?.where?.documentNumber && options?.where?.id === Not('1')) {
                return null; // Para verificação de documento duplicado
              }
              if (options?.where?.id === 'not-found') {
                return null;
              }
              return mockProducer;
            }),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            count: jest.fn().mockImplementation((options) => {
              if (options?.where?.documentNumber) {
                return 0;
              }
              return 1;
            }),
            find: jest.fn().mockResolvedValue([mockProducer]),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue(mockProducer),
              getMany: jest.fn().mockResolvedValue([mockProducer]),
            })),
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn().mockResolvedValue('OK'),
            get: jest.fn().mockResolvedValue(JSON.stringify(mockProducer)),
            del: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProducersService>(ProducersService);
    producerRepository = module.get<Repository<Producer>>(getRepositoryToken(Producer));
    redisService = module.get<RedisService>(RedisService);
    loggerService = module.get<LoggerService>(LoggerService);

    // Mock validation methods to always pass
    jest.spyOn(service as any, 'validateCPF').mockReturnValue(true);
    jest.spyOn(service as any, 'validateCNPJ').mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new producer', async () => {
      const createDto: CreateProducerDto = {
        name: 'Test Producer',
        documentNumber: '529.982.247-25',
        documentType: DocumentType.CPF,
      };

      const result = await service.create(createDto);
      expect(result).toEqual(mockProducer);
      expect(producerRepository.create).toHaveBeenCalledWith({
        ...createDto,
        documentNumber: '52998224725',
      });
      expect(producerRepository.save).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(`producer:${mockProducer.id}`, JSON.stringify(mockProducer));
    });

    it('should throw BadRequestException if document already exists', async () => {
      jest.spyOn(producerRepository, 'count').mockResolvedValueOnce(1);
      
      const createDto: CreateProducerDto = {
        name: 'Test Producer',
        documentNumber: '529.982.247-25',
        documentType: DocumentType.CPF,
      };

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated producers', async () => {
      const options: IPaginationOptions = { page: 1, limit: 10 };
      const result = await service.findAll(options);
      
      expect(result.items.length).toBe(1);
      expect(result.items[0]).toBeInstanceOf(ProducerResponseDto);
      expect(paginate).toHaveBeenCalled();
    });

    it('should return all producers when no pagination options', async () => {
      const result = await service.findAll();
      
      expect(result.items.length).toBe(1);
      expect(result.items[0]).toBeInstanceOf(ProducerResponseDto);
      expect(producerRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a producer by id', async () => {
      const result = await service.findOne('1');
      expect(result).toBeInstanceOf(ProducerResponseDto);
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if producer not found', async () => {
      jest.spyOn(producerRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a producer', async () => {
      await service.remove('1');
      expect(producerRepository.delete).toHaveBeenCalledWith('1');
      expect(redisService.del).toHaveBeenCalledWith('producer:1');
    });

    it('should throw NotFoundException if producer not found', async () => {
      jest.spyOn(producerRepository, 'delete').mockResolvedValueOnce({ affected: 0 } as any);
      await expect(service.remove('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('searchByName', () => {
    it('should search producers by name', async () => {
      const result = await service.searchByName('Test');
      expect(result).toEqual([mockProducer]);
      expect(producerRepository.find).toHaveBeenCalledWith({
        where: {
          name: ILike('%Test%'),
        },
      });
    });
  });

  describe('findByDocumentType', () => {
    it('should find producers by document type', async () => {
      const result = await service.findByDocumentType(DocumentType.CPF);
      expect(result).toEqual([mockProducer]);
      expect(producerRepository.find).toHaveBeenCalledWith({
        where: {
          documentType: DocumentType.CPF,
        },
      });
    });
  });

  describe('findByDocument', () => {
    it('should find producers by document', async () => {
      const result = await service.findByDocument(DocumentType.CPF, '529.982.247-25');
      expect(result).toEqual([mockProducer]);
      expect(producerRepository.find).toHaveBeenCalledWith({
        where: {
          documentType: DocumentType.CPF,
          documentNumber: '52998224725',
        },
      });
    });
  });
});