import {
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Farm } from './entities/farm.entity';
import { Producer } from '../producers/entities/producer.entity';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { FarmResponseDto } from './dto/farm-response.dto';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { LoggerService } from '../../shared/logger/logger.service';
import { RedisService } from '../redis/redis.service';  // Importar RedisService

@Injectable()
export class FarmsService {

  constructor(
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,

    @InjectRepository(Producer)
    private readonly producerRepository: Repository<Producer>,

    private readonly logger: LoggerService,

    private readonly redisService: RedisService,  // Injetar RedisService
  ) {}

  private getCacheKey(id: string) {
    return `farm:${id}`;
  }

  async create(createFarmDto: CreateFarmDto): Promise<Farm> {
    this.logger.log('Iniciando criação de fazenda...');
    const { arableArea, vegetationArea, totalArea, producerId, ...data } = createFarmDto;

    try {
      if ((arableArea ?? 0) + (vegetationArea ?? 0) > (totalArea ?? 0)) {
        this.logger.warn('Validação falhou: soma das áreas excede área total.');
        throw new BadRequestException(
          'A soma das áreas agricultável e de vegetação não pode ultrapassar a área total da fazenda.',
        );
      }

      const producer = await this.producerRepository.findOne({ where: { id: producerId } });

      if (!producer) {
        throw new NotFoundException('Produtor não encontrado');
      }

      const farm = this.farmRepository.create({
        ...data,
        arableArea,
        vegetationArea,
        totalArea,
        producer,
      });

      const savedFarm = await this.farmRepository.save(farm);

      // Salvar no Redis cache
      await this.redisService.set(this.getCacheKey(savedFarm.id), JSON.stringify(savedFarm));

      this.logger.log(`Fazenda criada com sucesso: ID ${savedFarm.id}`);
      return savedFarm;
    } catch (error) {
      this.logger.error('Erro ao criar fazenda', error.stack);
      throw error;
    }
  }

  async findAll(options?: IPaginationOptions): Promise<Pagination<FarmResponseDto>> {
    this.logger.log(`Buscando fazendas com opções: ${JSON.stringify(options)}`);

    try {
      const queryBuilder = this.farmRepository
        .createQueryBuilder('farm')
        .leftJoinAndSelect('farm.producer', 'producer')
        .orderBy('farm.name', 'ASC');

      const result = await paginate<Farm>(queryBuilder, options);

      this.logger.log(
        `Paginação retornou ${result.items.length} fazendas, total ${result.meta.totalItems}`,
      );

      const mappedItems = result.items.map(item => this.mapToDto(item));

      return {
        ...result,
        items: mappedItems,
      };
    } catch (error) {

      this.logger.error('Erro ao buscar fazendas', {
        message: error.message,
        stack: error.stack,
      });

      throw new BadRequestException('Erro ao buscar fazendas.');
    }
  }

  async searchByName(name: string): Promise<Farm[]> {
    this.logger.log(`Buscando fazendas pelo nome: ${name}`);
    try {
      const farms = await this.farmRepository.find({
        where: { name: Like(`%${name}%`) },
      });
      this.logger.log(`Fazendas encontradas pela busca por nome: ${farms.length}`);
      return farms;
    } catch (error) {
      this.logger.error('Erro na busca por nome', error.stack);
      throw new BadRequestException('Erro ao buscar fazendas por nome.');
    }
  }

  async searchByStateAndCity(state: string, city?: string): Promise<Farm[]> {
    this.logger.log(`Buscando fazendas no estado: ${state}${city ? `, cidade: ${city}` : ''}`);
    const whereCondition = city
      ? { state, city }
      : { state };

    try {
      const farms = await this.farmRepository.find({ where: whereCondition });
      this.logger.log(`Fazendas encontradas por estado e cidade: ${farms.length}`);
      return farms;
    } catch (error) {
      this.logger.error('Erro na busca por estado e cidade', error.stack);
      throw new BadRequestException('Erro ao buscar fazendas por estado e cidade.');
    }
  }

  async findOne(id: string): Promise<Farm> {
    this.logger.log(`Buscando fazenda por ID: ${id}`);

    // Buscar no Redis antes do banco
    const cached = await this.redisService.get(this.getCacheKey(id));
    if (cached) {
      this.logger.log(`Cache Redis encontrado para farm ID ${id}`);
      const farm: Farm = JSON.parse(cached);
      return farm;
    }

    const farm = await this.farmRepository.findOne({ where: { id }, relations: ['producer'] });
    if (!farm) {
      this.logger.warn(`Fazenda não encontrada com ID: ${id}`);
      throw new NotFoundException(`Fazenda com ID ${id} não encontrada`);
    }

    // Salvar no Redis para próximas consultas
    await this.redisService.set(this.getCacheKey(id), JSON.stringify(farm));

    this.logger.log(`Fazenda encontrada com ID: ${id}`);
    return farm;
  }

  async update(id: string, updateFarmDto: UpdateFarmDto): Promise<Farm> {
    this.logger.log(`Atualizando fazenda com ID: ${id}`);
    try {
      const farm = await this.findOne(id);
      Object.assign(farm, updateFarmDto);
      const updatedFarm = await this.farmRepository.save(farm);

      // Atualizar cache Redis
      await this.redisService.set(this.getCacheKey(updatedFarm.id), JSON.stringify(updatedFarm));

      this.logger.log(`Fazenda atualizada com sucesso: ID ${id}`);
      return updatedFarm;
    } catch (error) {
      this.logger.error(`Erro ao atualizar fazenda com ID ${id}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removendo fazenda com ID: ${id}`);
    try {
      const farm = await this.findOne(id);
      await this.farmRepository.remove(farm);

      // Remover do cache Redis
      await this.redisService.del(this.getCacheKey(id));

      this.logger.log(`Fazenda removida com sucesso: ID ${id}`);
    } catch (error) {
      this.logger.error(`Erro ao remover fazenda com ID ${id}`, error.stack);
      throw error;
    }
  }

  private mapToDto(farm: Farm): FarmResponseDto {
    return new FarmResponseDto({
      id: farm.id,
      name: farm.name,
      city: farm.city,
      state: farm.state,
      totalArea: farm.totalArea,
      arableArea: farm.arableArea,
      vegetationArea: farm.vegetationArea,
      producer: farm.producer || null,
    });
  }

}
