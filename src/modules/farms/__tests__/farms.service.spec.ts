import { Test, TestingModule } from '@nestjs/testing';
import { FarmsService } from '../farms.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Farm } from '../entities/farm.entity';
import { Producer } from '../../producers/entities/producer.entity';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../redis/redis.service';
import { Repository } from 'typeorm';
import { CreateFarmDto } from '../dto/create-farm.dto';
import { UpdateFarmDto } from '../dto/update-farm.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { DocumentType } from '../../producers/dto/create-producer.dto';

describe('FarmsService', () => {
  let service: FarmsService;
  let farmRepository: Repository<Farm>;
  let producerRepository: Repository<Producer>;
  let redisService: RedisService;
  let loggerService: LoggerService;

  const mockFarm: Farm = {
    id: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
    name: 'Fazenda Santa Maria',
    city: 'Ribeirão Preto',
    state: 'SP',
    totalArea: 1500.75,
    arableArea: 1000.25,
    vegetationArea: 500.50,
    producer: {
      id: 'producer-123',
      name: 'Produtor Teste'
    } as Producer,
    crops: []
  };

  const mockProducer: Producer = {
    id: 'producer-123',
    name: 'Produtor Teste',
    documentNumber: '12345678901',
    documentType: DocumentType.CPF,
    farms: [],
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-15T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FarmsService,
        {
          provide: getRepositoryToken(Farm),
          useValue: {
            create: jest.fn().mockReturnValue(mockFarm),
            save: jest.fn().mockResolvedValue(mockFarm),
            findOne: jest.fn().mockResolvedValue(mockFarm),
            find: jest.fn().mockResolvedValue([mockFarm]),
            remove: jest.fn().mockResolvedValue(mockFarm),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[mockFarm], 1]),
            })),
          },
        },
        {
          provide: getRepositoryToken(Producer),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockProducer),
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
        {
          provide: RedisService,
          useValue: {
            set: jest.fn().mockResolvedValue('OK'),
            get: jest.fn().mockResolvedValue(JSON.stringify(mockFarm)),
            del: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<FarmsService>(FarmsService);
    farmRepository = module.get<Repository<Farm>>(getRepositoryToken(Farm));
    producerRepository = module.get<Repository<Producer>>(getRepositoryToken(Producer));
    redisService = module.get<RedisService>(RedisService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateFarmDto = {
      name: 'Fazenda Santa Maria',
      city: 'Ribeirão Preto',
      state: 'SP',
      totalArea: 1500.75,
      arableArea: 1000.25,
      vegetationArea: 500.50,
      producerId: 'producer-123',
    };

    it('should create a farm successfully', async () => {
      const result = await service.create(createDto);
      expect(result).toEqual(mockFarm);
      expect(producerRepository.findOne).toHaveBeenCalledWith({ where: { id: createDto.producerId } });
      expect(farmRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...createDto,
        producer: mockProducer,
      }));
      expect(redisService.set).toHaveBeenCalledWith(
        `farm:${mockFarm.id}`,
        JSON.stringify(mockFarm)
      );
    });

    it('should throw BadRequestException if areas are invalid', async () => {
      const invalidDto = { ...createDto, arableArea: 1000, vegetationArea: 600 };
      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if producer not found', async () => {
      jest.spyOn(producerRepository, 'findOne').mockResolvedValueOnce(null);
      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated farms', async () => {
      const options = { page: 1, limit: 10 };
      const result = await service.findAll(options);
      
      expect(result).toEqual({
        items: [mockFarm],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
        links: expect.anything(),
      });
    });
  });

  describe('findOne', () => {
    it('should return a farm from cache', async () => {
      const result = await service.findOne(mockFarm.id);
      expect(result).toEqual(mockFarm);
      expect(redisService.get).toHaveBeenCalledWith(`farm:${mockFarm.id}`);
      expect(farmRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return a farm from database if not in cache', async () => {
      jest.spyOn(redisService, 'get').mockResolvedValueOnce(null);
      const result = await service.findOne(mockFarm.id);
      expect(result).toEqual(mockFarm);
      expect(farmRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockFarm.id },
        relations: ['producer'],
      });
      expect(redisService.set).toHaveBeenCalledWith(
        `farm:${mockFarm.id}`,
        JSON.stringify(mockFarm)
      );
    });

    it('should throw NotFoundException if farm not found', async () => {
      jest.spyOn(redisService, 'get').mockResolvedValueOnce(null);
      jest.spyOn(farmRepository, 'findOne').mockResolvedValueOnce(null);
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateFarmDto = {
      name: 'Fazenda Atualizada',
    };

    it('should update a farm', async () => {
      const updatedFarm = { ...mockFarm, ...updateDto };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockFarm);
      jest.spyOn(farmRepository, 'save').mockResolvedValueOnce(updatedFarm);

      const result = await service.update(mockFarm.id, updateDto);
      expect(result).toEqual(updatedFarm);
      expect(redisService.set).toHaveBeenCalledWith(
        `farm:${mockFarm.id}`,
        JSON.stringify(updatedFarm)
      );
    });
  });

  describe('remove', () => {
    it('should remove a farm', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockFarm);
      await service.remove(mockFarm.id);
      expect(farmRepository.remove).toHaveBeenCalledWith(mockFarm);
      expect(redisService.del).toHaveBeenCalledWith(`farm:${mockFarm.id}`);
    });
  });

  describe('searchByName', () => {
    it('should search farms by name', async () => {
      const result = await service.searchByName('Santa');
      expect(result).toEqual([mockFarm]);
      expect(farmRepository.find).toHaveBeenCalledWith({
        where: { name: expect.any(Object) },
      });
    });
  });

  describe('searchByStateAndCity', () => {
    it('should search farms by state and city', async () => {
      const result = await service.searchByStateAndCity('SP', 'Ribeirão Preto');
      expect(result).toEqual([mockFarm]);
      expect(farmRepository.find).toHaveBeenCalledWith({
        where: { state: 'SP', city: 'Ribeirão Preto' },
      });
    });

    it('should search farms by state only', async () => {
      const result = await service.searchByStateAndCity('SP');
      expect(result).toEqual([mockFarm]);
      expect(farmRepository.find).toHaveBeenCalledWith({
        where: { state: 'SP' },
      });
    });
  });
});