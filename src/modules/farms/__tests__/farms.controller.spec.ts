import { Test, TestingModule } from '@nestjs/testing';
import { FarmsController } from '../farms.controller';
import { FarmsService } from '../farms.service';
import { FarmResponseDto } from '../dto/farm-response.dto';
import { CreateFarmDto } from '../dto/create-farm.dto';
import { UpdateFarmDto } from '../dto/update-farm.dto';
import { plainToInstance } from 'class-transformer';
import { Pagination } from 'nestjs-typeorm-paginate';

describe('FarmsController', () => {
  let controller: FarmsController;
  let service: FarmsService;

  const mockFarm = {
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
    },
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-15T00:00:00.000Z'),
  };

  const mockPaginationResult: Pagination<FarmResponseDto> = {
    items: [plainToInstance(FarmResponseDto, mockFarm)],
    meta: {
      totalItems: 1,
      itemCount: 1,
      itemsPerPage: 10,
      totalPages: 1,
      currentPage: 1,
    },
    links: {
      first: 'url?page=1',
      previous: '',
      next: '',
      last: 'url?page=1',
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FarmsController],
      providers: [
        {
          provide: FarmsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockFarm),
            findAll: jest.fn().mockResolvedValue(mockPaginationResult),
            findOne: jest.fn().mockResolvedValue(mockFarm),
            update: jest.fn().mockResolvedValue(mockFarm),
            remove: jest.fn().mockResolvedValue(undefined),
            searchByName: jest.fn().mockResolvedValue([mockFarm]),
            searchByStateAndCity: jest.fn().mockResolvedValue([mockFarm]),
          },
        },
      ],
    }).compile();

    controller = module.get<FarmsController>(FarmsController);
    service = module.get<FarmsService>(FarmsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new farm', async () => {
      const createDto: CreateFarmDto = {
        name: 'Fazenda Santa Maria',
        city: 'Ribeirão Preto',
        state: 'SP',
        totalArea: 1500.75,
        arableArea: 1000.25,
        vegetationArea: 500.50,
        producerId: 'producer-123',
      };

      const result = await controller.create(createDto);
      expect(result).toBeInstanceOf(FarmResponseDto);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated farms', async () => {
      const result = await controller.findAll(1, 10);
      expect(result).toEqual(mockPaginationResult);
      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('findOne', () => {
    it('should return a single farm', async () => {
      const result = await controller.findOne(mockFarm.id);
      expect(result).toBeInstanceOf(FarmResponseDto);
      expect(service.findOne).toHaveBeenCalledWith(mockFarm.id);
    });
  });

  describe('update', () => {
    it('should update a farm', async () => {
      const updateDto: UpdateFarmDto = {
        name: 'Fazenda Santa Maria Atualizada',
      };

      const result = await controller.update(mockFarm.id, updateDto);
      expect(result).toBeInstanceOf(FarmResponseDto);
      expect(service.update).toHaveBeenCalledWith(mockFarm.id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a farm', async () => {
      await expect(controller.remove(mockFarm.id)).resolves.toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(mockFarm.id);
    });
  });

  describe('searchByName', () => {
    it('should search farms by name', async () => {
      const result = await controller.searchByName('Santa');
      expect(result[0]).toBeInstanceOf(FarmResponseDto);
      expect(service.searchByName).toHaveBeenCalledWith('Santa');
    });
  });

  describe('searchByStateAndCity', () => {
    it('should search farms by state and city', async () => {
      const result = await controller.searchByStateAndCity('SP', 'Ribeirão Preto');
      expect(result[0]).toBeInstanceOf(FarmResponseDto);
      expect(service.searchByStateAndCity).toHaveBeenCalledWith('SP', 'Ribeirão Preto');
    });

    it('should search farms by state only', async () => {
      const result = await controller.searchByStateAndCity('SP');
      expect(result[0]).toBeInstanceOf(FarmResponseDto);
      expect(service.searchByStateAndCity).toHaveBeenCalledWith('SP', undefined);
    });
  });
});