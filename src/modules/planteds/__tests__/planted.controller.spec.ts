import { Test, TestingModule } from '@nestjs/testing';
import { PlantedController } from '../planted.controller';
import { PlantedService } from '../planted.service';
import { CreatePlantedDto } from '../dto/create-planted.dto';
import { UpdatePlantedDto } from '../dto/update-planted.dto';
import { PlantedResponseDto } from '../dto/planted-response.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { CropResponseDto } from '../../crops/dto/crop-response.dto'; 

describe('PlantedController', () => {
  let controller: PlantedController;
  let service: PlantedService;

  const mockCrop: CropResponseDto = {
    id: 'uuid-da-safra',
    name: 'Safra 2023',
    year: '2001',
    farmId: '1'
  };

  const mockPlantedResponse: PlantedResponseDto = {
    id: 'uuid-da-cultura-plantada',
    name: 'Soja',
    cropId: 'uuid-da-safra',
    crop: mockCrop, // pode ser null também se desejar testar esse caso
  };

  const mockPagination: Pagination<PlantedResponseDto> = {
    items: [mockPlantedResponse],
    meta: {
      totalItems: 1,
      itemCount: 1,
      itemsPerPage: 10,
      totalPages: 1,
      currentPage: 1,
    },
    links: {
      first: 'first',
      previous: 'previous',
      next: 'next',
      last: 'last',
    },
  };

  const plantedServiceMock = {
    create: jest.fn(dto => Promise.resolve(mockPlantedResponse)),
    findAll: jest.fn(() => Promise.resolve(mockPagination)),
    findByCropId: jest.fn(cropId => Promise.resolve([mockPlantedResponse])),
    findOne: jest.fn(id => Promise.resolve(mockPlantedResponse)),
    update: jest.fn((id, dto) => Promise.resolve(mockPlantedResponse)),
    remove: jest.fn(id => Promise.resolve()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlantedController],
      providers: [
        {
          provide: PlantedService,
          useValue: plantedServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PlantedController>(PlantedController);
    service = module.get<PlantedService>(PlantedService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new planted culture', async () => {
      const dto: CreatePlantedDto = { name: 'Soja', cropId: 'uuid-da-safra' };
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockPlantedResponse);
    });
  });

  describe('findAll', () => {
    it('should return paginated planted cultures', async () => {
      const page = 1;
      const limit = 10;
      const result = await controller.findAll(page, limit);
      expect(service.findAll).toHaveBeenCalledWith({ page, limit });
      expect(result).toEqual(mockPagination);
    });
  });

  describe('findByCrop', () => {
    it('should return cultures by cropId', async () => {
      const cropId = 'uuid-da-safra';
      const result = await controller.findByCrop(cropId);
      expect(service.findByCropId).toHaveBeenCalledWith(cropId);
      expect(result).toEqual([mockPlantedResponse]);
    });
  });

  describe('findOne', () => {
    it('should return one culture by id', async () => {
      const id = 'uuid-da-cultura-plantada';
      const result = await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockPlantedResponse);
    });
  });

  describe('update', () => {
    it('should update culture data', async () => {
      const id = 'uuid-da-cultura-plantada';
      const dto: UpdatePlantedDto = { name: 'Laranja', cropId: '1' };
      const result = await controller.update(id, dto);
      expect(service.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(mockPlantedResponse);
    });
  });

  describe('remove', () => {
    it('should remove culture by id', async () => {
      const id = 'uuid-da-cultura-plantada';
      await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
