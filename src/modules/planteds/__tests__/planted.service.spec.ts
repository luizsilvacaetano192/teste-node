import { Test, TestingModule } from '@nestjs/testing';
import { PlantedService } from '../planted.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Planted } from '../entities/planted.entity';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../redis/redis.service';

// Mock simples para LoggerService
const loggerMock = {
  log: jest.fn(),
  warn: jest.fn(),
};

const redisServiceMock = {
  del: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
};

// Mock básico para o Repository<Planted>
const plantedRepositoryMock = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
};

// Mock para paginate do nestjs-typeorm-paginate
jest.mock('nestjs-typeorm-paginate', () => ({
  paginate: jest.fn(),
}));

import { paginate } from 'nestjs-typeorm-paginate';

describe('PlantedService', () => {
  let service: PlantedService;
  let repository: Repository<Planted>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantedService,
        {
          provide: getRepositoryToken(Planted),
          useValue: plantedRepositoryMock,
        },
        {
          provide: LoggerService,
          useValue: loggerMock,
        },
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
      ],
    }).compile();

    service = module.get<PlantedService>(PlantedService);
    repository = module.get<Repository<Planted>>(getRepositoryToken(Planted));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a planted culture', async () => {
      const dto = {
        cropId: '1',
        name: 'Soja',
      };

      const createdEntity = { id: 'abc123', ...dto };
      plantedRepositoryMock.create.mockReturnValue(createdEntity);
      plantedRepositoryMock.save.mockResolvedValue(createdEntity);

      const result = await service.create(dto);

      expect(plantedRepositoryMock.create).toHaveBeenCalledWith(dto);
      expect(plantedRepositoryMock.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toHaveProperty('id', 'abc123');
      expect(result.name).toBe(dto.name);
    });

    it('should throw BadRequestException if cropId or name missing', async () => {
      const dto = { cropId: null, name: null };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated planted cultures', async () => {
      const items = [{ id: '1', name: 'Soja', cropId: '10', crop: null }];
      const paginatedResult = {
        items,
        meta: { totalItems: 1, itemCount: 1, itemsPerPage: 10, totalPages: 1, currentPage: 1 },
        links: { first: '', previous: '', next: '', last: '' },
      };

      const queryBuilderMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      };

      plantedRepositoryMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

      (paginate as jest.Mock).mockResolvedValue(paginatedResult);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(plantedRepositoryMock.createQueryBuilder).toHaveBeenCalled();
      expect(paginate).toHaveBeenCalledWith(queryBuilderMock, { page: 1, limit: 10 });
      expect(result).toEqual(paginatedResult);
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when updating nonexistent planted', async () => {
      plantedRepositoryMock.findOne.mockResolvedValue(undefined);

      await expect(service.update('nonexistent', { name: 'Café' })).rejects.toThrow(NotFoundException);
      expect(loggerMock.warn).toHaveBeenCalled();
    });

    it('should update and return updated entity', async () => {
      const existing = { id: 'abc', name: 'OldName', cropId: '1' };
      const updatedData = { name: 'NewName' };
      const savedEntity = { ...existing, ...updatedData };

      plantedRepositoryMock.findOne.mockResolvedValue(existing);
      plantedRepositoryMock.save.mockResolvedValue(savedEntity);

      const result = await service.update('abc', updatedData);

      expect(plantedRepositoryMock.findOne).toHaveBeenCalledWith({ where: { id: 'abc' } });
      expect(plantedRepositoryMock.save).toHaveBeenCalledWith({ ...existing, ...updatedData });
      expect(result.name).toBe('NewName');
    });
  });

  describe('remove', () => {
    it('should delete a planted culture', async () => {
      plantedRepositoryMock.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove('abc')).resolves.toBeUndefined();
      expect(plantedRepositoryMock.delete).toHaveBeenCalledWith('abc');
    });

    it('should throw NotFoundException if trying to delete nonexisting entity', async () => {
      plantedRepositoryMock.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });
});
