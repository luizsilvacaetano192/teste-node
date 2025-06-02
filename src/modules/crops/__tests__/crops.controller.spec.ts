import { Test, TestingModule } from '@nestjs/testing';
import { CropsController } from '../crops.controller';
import { CropsService } from '../crops.service';
import { CreateCropDto } from '../dto/create-crop.dto';
import { UpdateCropDto } from '../dto/update-crop.dto';
import { CropResponseDto } from '../dto/crop-response.dto';
import { Pagination } from 'nestjs-typeorm-paginate';

describe('CropsController', () => {
  let cropsController: CropsController;
  let cropsService: CropsService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CropsController],
      providers: [
        {
          provide: CropsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            searchByName: jest.fn(),
            searchByFarm: jest.fn(),
            searchByDateRange: jest.fn(),
          },
        },
      ],
    }).compile();

    cropsController = moduleRef.get<CropsController>(CropsController);
    cropsService = moduleRef.get<CropsService>(CropsService);
  });

  describe('create', () => {
    it('deve criar uma nova cultura', async () => {
      const dto: CreateCropDto = {
        name: 'Safra 2023',
        year: '2023',
        farmId: '1',
      };
      const response: CropResponseDto = {
        id: '1',
        name: dto.name,
        year: dto.year,
        farmId: dto.farmId,
      };

      jest.spyOn(cropsService, 'create').mockResolvedValue(response);

      const result = await cropsController.create(dto);

      expect(cropsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de culturas', async () => {
      const paginationResult: Pagination<CropResponseDto> = {
        items: [
          { id: '1', name: 'Safra 2022', year: '2022', farmId: '1' },
          { id: '2', name: 'Safra 2023', year: '2023', farmId: '2'},
        ],
        meta: {
          itemCount: 2,
          totalItems: 2,
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

      jest.spyOn(cropsService, 'findAll').mockResolvedValue(paginationResult);

      const result = await cropsController.findAll(1, 10);

      expect(cropsService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toEqual(paginationResult);
    });
  });

  describe('findOne', () => {
    it('deve retornar cultura pelo id', async () => {
      const id = '1';
      const response: CropResponseDto = {
        id,
        name: 'Safra 2023',
        year: '2023',
        farmId: '1',
      };

      jest.spyOn(cropsService, 'findOne').mockResolvedValue(response);

      const result = await cropsController.findOne(id);

      expect(cropsService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(response);
    });
  });

  describe('update', () => {
    it('deve atualizar cultura existente', async () => {
      const id = '1';
      const dto: UpdateCropDto = {
        name: 'Safra 2024',
        year: '2024',
        farmId: '1',
      };
      const response: CropResponseDto = {
        id,
        name: dto.name,
        year: dto.year,
        farmId: dto.farmId,
      };

      jest.spyOn(cropsService, 'update').mockResolvedValue(response);

      const result = await cropsController.update(id, dto);

      expect(cropsService.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(response);
    });

    it('deve lançar erro se cultura não encontrada', async () => {
      const id = 'not-found';
      const dto: UpdateCropDto = {
        name: 'Safra 2024',
        year: '2024',
        farmId: '1',
      };

      jest.spyOn(cropsService, 'update').mockRejectedValue(new Error('Cultura não encontrada'));

      await expect(cropsController.update(id, dto)).rejects.toThrow('Cultura não encontrada');
      expect(cropsService.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('remove', () => {
    it('deve remover cultura pelo id', async () => {
      const id = '1';

      jest.spyOn(cropsService, 'remove').mockResolvedValue();

      await cropsController.remove(id);

      expect(cropsService.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('searchByName', () => {
    it('deve buscar culturas por nome', async () => {
      const name = 'Soja';
      const response: CropResponseDto[] = [
        { id: '1', name: 'Soja 2023', year: '2023', farmId:   '1'  },
      ];

      jest.spyOn(cropsService, 'searchByName').mockResolvedValue(response);

      const result = await cropsController.searchByName(name);

      expect(cropsService.searchByName).toHaveBeenCalledWith(name);
      expect(result).toEqual(response);
    });
  });

  describe('searchByFarm', () => {
    it('deve buscar culturas por fazenda', async () => {
      const farmId = '1';
      const response: CropResponseDto[] = [
        { id: '1', name: 'Safra 2023', year: '2023', farmId: '1' },
      ];

      jest.spyOn(cropsService, 'searchByFarm').mockResolvedValue(response);

      const result = await cropsController.searchByFarm(farmId);

      expect(cropsService.searchByFarm).toHaveBeenCalledWith(farmId);
      expect(result).toEqual(response);
    });
  });

  describe('searchByDateRange', () => {
    it('deve buscar culturas por intervalo de anos', async () => {
      const startYear = '2020';
      const endYear = '2023';
      const response: CropResponseDto[] = [
        { id: '1', name: 'Safra 2021', year: '2021', farmId: '1' },
        { id: '2', name: 'Safra 2022', year: '2022', farmId: '2' },
      ];

      jest.spyOn(cropsService, 'searchByDateRange').mockResolvedValue(response);

      const result = await cropsController.searchByDateRange(startYear, endYear);

      expect(cropsService.searchByDateRange).toHaveBeenCalledWith(startYear, endYear);
      expect(result).toEqual(response);
    });
  });
});
