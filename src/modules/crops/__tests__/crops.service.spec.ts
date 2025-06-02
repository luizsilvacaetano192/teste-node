import { Test, TestingModule } from '@nestjs/testing';
import { CropsService } from '../crops.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Crop } from '../entities/crop.entity';
import { Repository, DeepPartial  } from 'typeorm';
import { RedisService } from '../../redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { CreateCropDto } from '../dto/create-crop.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Objeto de exemplo completo de uma safra
const cropArray: Crop[] = [
  { id: '1', name: 'Safra 1', year: '2023', farmId: 'farm1', farm: null, planted: [] },
  { id: '2', name: 'Safra 2', year: '2024', farmId: 'farm1', farm: null, planted: [] },
];

// Mock do repositório
const mockRepository = () => ({
  create: jest.fn().mockImplementation((dto) => ({
    ...dto,
    farm: null,
    planted: [],
  })),
  save: jest.fn().mockImplementation((dto) => ({
    id: dto.id ?? 'uuid',
    name: dto.name ?? 'default',
    year: dto.year ?? '2023',
    farmId: dto.farmId ?? 'farm1',
    farm: dto.farm ?? null,
    planted: dto.planted ?? [],
  })),
  findOne: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
  find: jest.fn(),
});

// Mock do Redis
const mockRedisService = () => ({
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
});

// Mock do logger
const mockLoggerService = () => ({
  log: jest.fn(),
  warn: jest.fn(),
});

describe('CropsService', () => {
  let service: CropsService;
  let repository: jest.Mocked<Repository<Crop>>;
  let redis: ReturnType<typeof mockRedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CropsService,
        { provide: getRepositoryToken(Crop), useFactory: mockRepository },
        { provide: RedisService, useFactory: mockRedisService },
        { provide: LoggerService, useFactory: mockLoggerService },
      ],
    }).compile();

    service = module.get<CropsService>(CropsService);
    repository = module.get(getRepositoryToken(Crop));
    redis = module.get(RedisService);
  });

  describe('create', () => {
    it('deve criar uma nova safra', async () => {
      const dto: CreateCropDto = {
        name: 'Soja',
        year: '2023',
        farmId: '123',
      };

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledWith(expect.stringContaining('crop:'), expect.any(String));
      expect(result.name).toBe(dto.name);
    });

    it('deve lançar exceção se faltar campos obrigatórios', async () => {
      await expect(service.create({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma safra existente', async () => {
      const crop = cropArray[0];
      repository.findOne.mockResolvedValue(crop);

      const result = await service.findOne('1');

      expect(result.name).toBe(crop.name);
    });

    it('deve lançar exceção se a safra não existir', async () => {
      repository.findOne.mockResolvedValue(undefined);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve remover uma safra existente', async () => {
      repository.findOne.mockResolvedValue(cropArray[0]);
      await service.remove('1');
      expect(repository.delete).toHaveBeenCalledWith('1');
      expect(redis.del).toHaveBeenCalledWith('crop:1');
    });

    it('deve lançar exceção se a safra não existir', async () => {
      repository.findOne.mockResolvedValue(undefined);
      await expect(service.remove('x')).rejects.toThrow(NotFoundException);
    });
  });

 describe('update', () => {
  it('deve atualizar uma safra existente', async () => {
    const oldCrop = { ...cropArray[0] };
    repository.findOne.mockResolvedValue(oldCrop);

    repository.save.mockImplementation(async (cropToSave: DeepPartial<Crop>) => {
      return {
        ...oldCrop,
        ...cropToSave,
      } as Crop;  // <-- aqui o cast que resolve o erro de tipagem
    });

    const updated = await service.update('1', { name: 'Nova Safra' });

    expect(updated.name).toBe('Nova Safra');
  });
});



  describe('searchByFarm', () => {
    it('deve buscar safras da fazenda no banco e salvar no cache', async () => {
      redis.get.mockResolvedValue(null);
      repository.find.mockResolvedValue(cropArray);

      const result = await service.searchByFarm('farm1');
      expect(result.length).toBe(2);
      expect(redis.set).toHaveBeenCalled();
    });

    it('deve retornar do cache se houver', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cropArray));
      const result = await service.searchByFarm('farm1');
      expect(result.length).toBe(2);
    });

    it('deve lançar exceção se não encontrar safras', async () => {
      redis.get.mockResolvedValue(null);
      repository.find.mockResolvedValue([]);
      await expect(service.searchByFarm('farm1')).rejects.toThrow(NotFoundException);
    });
  });
});
