import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Crop } from './entities/crop.entity';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';
import { CropResponseDto } from './dto/crop-response.dto';
import { RedisService } from '../redis/redis.service';
import { Pagination, IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { LoggerService } from '../../shared/logger/logger.service';


interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class CropsService {

  

  constructor(
    @InjectRepository(Crop)
    private readonly cropsRepository: Repository<Crop>,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService
    
  ) {}

  async create(createCropDto: CreateCropDto): Promise<CropResponseDto> {
    const { name, year, farmId } = createCropDto;

    if (!name || !year || !farmId) {
      this.logger.warn('Tentativa de criação com dados incompletos', createCropDto);
      throw new BadRequestException('Todos os campos são obrigatórios.');
    }

    this.logger.log(`Criando nova safra: ${JSON.stringify(createCropDto)}`);
    const crop = this.cropsRepository.create(createCropDto);
    const saved = await this.cropsRepository.save(crop);

    const response: CropResponseDto = {
      id: saved.id,
      name: saved.name,
      year: saved.year,
      farmId: saved.farmId,
    };

    await this.redisService.set(`crop:${response.id}`, JSON.stringify(response));
    this.logger.log(`Safra criada e salva em cache: crop:${response.id}`);

    return response;
  }

  async findAll(options?: IPaginationOptions): Promise<Pagination<CropResponseDto>> {
    this.logger.log(`Buscando todas as safras com opções de paginação: ${JSON.stringify(options)}`);

    const queryBuilder = this.cropsRepository
      .createQueryBuilder('crop')
      .orderBy('crop.year', 'DESC');

    const result = await paginate<Crop>(queryBuilder, options);

    this.logger.log(`Paginação retornou ${result.items.length} itens, total ${result.meta.totalItems}`);

    const mappedItems = result.items.map(this.mapToDto);

    return {
      ...result,
      items: mappedItems,
    };
  }

  async findOne(id: string): Promise<CropResponseDto> {
    this.logger.log(`Buscando safra por ID: ${id}`);
    const crop = await this.cropsRepository.findOne({ where: { id } });

    if (!crop) {
      this.logger.warn(`Safra com ID ${id} não encontrada`);
      throw new NotFoundException('Safra não encontrada');
    }

    return {
      id: crop.id,
      name: crop.name,
      year: crop.year,
      farmId: crop.farmId,
    };
  }

  async update(id: string, updateCropDto: UpdateCropDto): Promise<CropResponseDto> {
    this.logger.log(`Atualizando safra ${id} com dados: ${JSON.stringify(updateCropDto)}`);
    const crop = await this.cropsRepository.findOne({ where: { id } });

    if (!crop) {
      this.logger.warn(`Tentativa de atualizar safra inexistente: ${id}`);
      throw new NotFoundException('Safra não encontrada');
    }

    Object.assign(crop, updateCropDto);
    const saved = await this.cropsRepository.save(crop);

    const response: CropResponseDto = {
      id: saved.id,
      name: saved.name,
      year: saved.year,
      farmId: saved.farmId,
    };

    await this.redisService.set(`crop:${id}`, JSON.stringify(response));
    this.logger.log(`Safra ${id} atualizada e cache renovado`);

    return response;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removendo safra ${id}`);
    const crop = await this.cropsRepository.findOne({ where: { id } });

    if (!crop) {
      this.logger.warn(`Tentativa de remover safra inexistente: ${id}`);
      throw new NotFoundException('Safra não encontrada');
    }

    await this.cropsRepository.delete(id);
    await this.redisService.del(`crop:${id}`);
    this.logger.log(`Safra ${id} removida do banco e cache`);
  }

  async searchByName(name: string): Promise<CropResponseDto[]> {
    this.logger.log(`Buscando safras pelo nome: ${name}`);
    const crops = await this.cropsRepository
      .createQueryBuilder('crop')
      .where('LOWER(crop.name) LIKE :name', { name: `%${name.toLowerCase()}%` })
      .getMany();

    this.logger.log(`Total de safras encontradas pelo nome "${name}": ${crops.length}`);

    return crops.map((c) => ({
      id: c.id,
      name: c.name,
      year: c.year,
      farmId: c.farmId,
    }));
  }

  async searchByYearAndFarm(year: string, farmId?: string): Promise<CropResponseDto[]> {
    this.logger.log(`Buscando safras por ano ${year} ${farmId ? `e fazenda ${farmId}` : ''}`);
    const query = this.cropsRepository
      .createQueryBuilder('crop')
      .where('crop.year = :year', { year });

    if (farmId) {
      query.andWhere('crop.farmId = :farmId', { farmId });
    }

    const crops = await query.getMany();
    this.logger.log(`Safras encontradas: ${crops.length}`);

    return crops.map((c) => ({
      id: c.id,
      name: c.name,
      year: c.year,
      farmId: c.farmId,
    }));
  }

  async searchByFarm(farmId: string): Promise<CropResponseDto[]> {
    if (!farmId) {
      this.logger.warn('ID da fazenda ausente na busca por safra');
      throw new BadRequestException('o id da Fazenda é obrigatorio');
    }

    const cacheKey = `crops:farm:${farmId}`;
    const cachedData = await this.redisService.get(cacheKey);

    if (cachedData) {
      this.logger.log(`Safras da fazenda ${farmId} encontradas no cache`);
      return JSON.parse(cachedData);
    }

    this.logger.log(`Buscando safras da fazenda ${farmId} no banco de dados`);
    const crops = await this.cropsRepository.find({
      where: { farmId },
      order: { year: 'DESC' },
    });

    if (crops.length === 0) {
      this.logger.warn(`Nenhuma safra encontrada para a fazenda ${farmId}`);
      throw new NotFoundException(`Não existe plantação com esse id de fazenda ${farmId}`);
    }

    const response = crops.map(crop => ({
      id: crop.id,
      name: crop.name,
      year: crop.year,
      farmId: crop.farmId,
    }));

    await this.redisService.set(cacheKey, JSON.stringify(response), 3600);
    this.logger.log(`Safras da fazenda ${farmId} salvas em cache`);

    return response;
  }

  async searchByDateRange(startYear: string, endYear: string): Promise<CropResponseDto[]> {
    const start = parseInt(startYear, 10);
    const end = parseInt(endYear, 10);

    this.logger.log(`Buscando safras entre ${startYear} e ${endYear}`);

    if (isNaN(start) || isNaN(end)) {
      this.logger.warn('Anos inválidos fornecidos para intervalo de busca');
      throw new BadRequestException('Anos inválidos. Use o formato YYYY.');
    }

    if (start > end) {
      this.logger.warn('Ano inicial maior que o final');
      throw new BadRequestException('O ano inicial não pode ser maior que o ano final.');
    }

    const crops = await this.cropsRepository
      .createQueryBuilder('crop')
      .where('CAST(crop.year AS INTEGER) BETWEEN :start AND :end', {
        start,
        end,
      })
      .getMany();

    this.logger.log(`Safras encontradas no intervalo: ${crops.length}`);

    return crops.map((c) => ({
      id: c.id,
      name: c.name,
      year: c.year,
      farmId: c.farmId,
    }));
  }
  private mapToDto(crop: Crop): CropResponseDto {
    return {
      id: crop.id,
      name: crop.name || '',
      year: crop.year || '',
      farmId: crop.farmId,
    };
  }

}
