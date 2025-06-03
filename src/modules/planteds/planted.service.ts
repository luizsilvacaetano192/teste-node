import {
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Planted } from './entities/planted.entity';
import { CreatePlantedDto } from './dto/create-planted.dto';
import { UpdatePlantedDto } from './dto/update-planted.dto';
import { PlantedResponseDto } from './dto/planted-response.dto'; 
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { LoggerService } from '../../shared/logger/logger.service';
import { RedisService } from '../redis/redis.service';  // Importar RedisService

interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class PlantedService {

  constructor(
    @InjectRepository(Planted)
    private readonly repository: Repository<Planted>,
    private readonly logger: LoggerService,
    private readonly redisService: RedisService, // Injetar RedisService
  ) {}

  private getCacheKey(id: string) {
    return `planted:${id}`;
  }

  async create(dto: CreatePlantedDto): Promise<PlantedResponseDto> {
    this.logger.log(`Criando nova cultura plantada: ${JSON.stringify(dto)}`);

    const { name, cropId } = dto;
    if (!cropId || !name) {
      this.logger.warn('Falha na criação: cropId ou nome ausente');
      throw new BadRequestException('Campos obrigatórios: cropId e nome');
    }

    const entity = this.repository.create(dto);
    const saved = await this.repository.save(entity);

    // Salvar no Redis cache
    await this.redisService.set(this.getCacheKey(saved.id), JSON.stringify(saved));

    this.logger.log(`Cultura plantada criada com sucesso: ID ${saved.id}`);
    return this.mapToDto(saved);
  }


  async findAll(options?: IPaginationOptions): Promise<Pagination<PlantedResponseDto>> {
    this.logger.log(`Buscando todas as culturas plantadas com opções: ${JSON.stringify(options)}`);

    const queryBuilder = this.repository
      .createQueryBuilder('planted')
      .leftJoinAndSelect('planted.crop', 'crop')
      .orderBy('planted.name', 'DESC');

    const result = await paginate<Planted>(queryBuilder, options);

    this.logger.log(`Paginação retornou ${result.items.length} itens, total ${result.meta.totalItems}`);

    const mappedItems = result.items.map(this.mapToDto);

    return {
      ...result,
      items: mappedItems,
    };
  }


  async findOne(id: string): Promise<PlantedResponseDto> {
    this.logger.log(`Buscando cultura plantada por ID: ${id}`);

    // Tentar buscar no Redis antes do banco
    const cached = await this.redisService.get(this.getCacheKey(id));
    if (cached) {
      this.logger.log(`Cache Redis encontrado para planted ID ${id}`);
      const planted: Planted = JSON.parse(cached);
      return this.mapToDto(planted);
    }

    const planted = await this.repository.findOne({
      where: { id },
      relations: ['culture', 'crop'],
    });

    if (!planted) {
      this.logger.warn(`Cultura plantada não encontrada para o ID: ${id}`);
      throw new NotFoundException('Cultura plantada não encontrada');
    }

    // Salvar no Redis para próximas consultas
    await this.redisService.set(this.getCacheKey(id), JSON.stringify(planted));

    return this.mapToDto(planted);
  }

  async update(id: string, dto: UpdatePlantedDto): Promise<PlantedResponseDto> {
    this.logger.log(`Atualizando cultura plantada ID ${id} com dados: ${JSON.stringify(dto)}`);

    const planted = await this.repository.findOne({ where: { id } });

    if (!planted) {
      this.logger.warn(`Cultura plantada não encontrada para atualização, ID: ${id}`);
      throw new NotFoundException('Cultura plantada não encontrada');
    }

    Object.assign(planted, dto);
    const saved = await this.repository.save(planted);

    // Atualizar cache Redis
    await this.redisService.set(this.getCacheKey(saved.id), JSON.stringify(saved));

    this.logger.log(`Cultura plantada atualizada com sucesso: ID ${saved.id}`);
    return this.mapToDto(saved);
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removendo cultura plantada ID: ${id}`);

    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      this.logger.warn(`Falha ao remover cultura plantada: ID ${id} não encontrada`);
      throw new NotFoundException('Cultura plantada não encontrada');
    }

    // Remover do cache Redis
    await this.redisService.del(this.getCacheKey(id));

    this.logger.log(`Cultura plantada removida com sucesso: ID ${id}`);
  }

  async findByCropId(cropId: string): Promise<PlantedResponseDto[]> {
    this.logger.log(`Buscando culturas plantadas por cropId: ${cropId}`);

    if (!cropId) {
      this.logger.warn('Busca por cropId falhou: cropId ausente');
      throw new BadRequestException('O ID da safra (cropId) é obrigatório.');
    }

    const planteds = await this.repository
      .createQueryBuilder('planted')
      .leftJoinAndSelect('planted.culture', 'culture')
      .leftJoinAndSelect('planted.crop', 'crop')
      .where('planted.cropId = :cropId', { cropId })
      .orderBy('planted.plantingDate', 'DESC')
      .getMany();

    this.logger.log(`Encontradas ${planteds.length} culturas plantadas para cropId: ${cropId}`);

    return planteds.map(this.mapToDto);
  }
  
  private mapToDto(planted: Planted): PlantedResponseDto {
    return {
      id: planted.id,
      name: planted.name || '',
      cropId: planted.cropId,
      crop: planted.crop
        ? {
            id: planted.crop.id,
            name: planted.crop.name,
            year: planted.crop.year,
            farmId: planted.crop.farmId,
          }
        : null,
    };
  }
}
