import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Farm } from './entities/farm.entity';
import { Producer } from '../producers/entities/producer.entity';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { FarmResponseDto } from './dto/farm-response.dto';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { LoggerService } from '../../shared/logger/logger.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm) 
    private readonly farmRepository: Repository<Farm>,
    @InjectRepository(Producer) 
    private readonly producerRepository: Repository<Producer>,
    private readonly logger: LoggerService,
    private readonly redisService: RedisService,
  ) {}

  private getCacheKey(id: string): string {
    return `farm:${id}`;
  }

  async create(createFarmDto: CreateFarmDto): Promise<FarmResponseDto> {
    this.logger.log('Iniciando criação de fazenda...', { dto: createFarmDto });

    const { arableArea, vegetationArea, totalArea, producerId } = createFarmDto;
    this.validateAreas(arableArea, vegetationArea, totalArea);

    this.logger.log(`Buscando produtor com ID ${producerId} para associação à fazenda...`);
    const producer = await this.producerRepository.findOne({ 
      where: { id: producerId } 
    });

    if (!producer) {
      this.logger.warn(`Produtor com ID ${producerId} não encontrado.`);
      throw new NotFoundException('Produtor não encontrado');
    }

    this.logger.log('Criando entidade fazenda para salvar no banco...');
    const farm = this.farmRepository.create({ 
      ...createFarmDto, 
      producer 
    });

    this.logger.log('Salvando fazenda no banco de dados...');
    const savedFarm = await this.farmRepository.save(farm);

    this.logger.log(`Atualizando cache para fazenda ID: ${savedFarm.id}`);
    await this.redisService.set(
      this.getCacheKey(savedFarm.id), 
      JSON.stringify(savedFarm)
    );

    this.logger.log(`Fazenda criada com sucesso: ID ${savedFarm.id}`);
    return this.mapToDto(savedFarm);
  }

  async findAll(options?: IPaginationOptions): Promise<Pagination<FarmResponseDto>> {
    this.logger.log('Buscando todas as fazendas com paginação via QueryBuilder', { options });

    try {
      const queryBuilder = this.farmRepository.createQueryBuilder('farm')
        .leftJoinAndSelect('farm.producer', 'producer')
        .orderBy('farm.name', 'ASC');

      const result = await paginate<Farm>(queryBuilder, options);

      this.logger.log(`Encontradas ${result.items.length} fazendas na página ${options?.page || 1}`);

      return {
        ...result,
        items: result.items.map(farm => this.mapToDto(farm)),
      };
    } catch (error) {
      this.logger.error('Erro ao buscar fazendas via QueryBuilder', error.stack);
      throw new BadRequestException('Erro ao buscar fazendas.');
    }
  }

  async searchByName(name: string): Promise<FarmResponseDto[]> {
    this.logger.log(`Buscando fazendas pelo nome contendo: "${name}"`);

    try {
      const farms = await this.farmRepository.find({
        where: { name: Like(`%${name}%`) },
        relations: ['producer'],
      });

      this.logger.log(`Encontradas ${farms.length} fazendas com nome similar.`);
      return farms.map(farm => this.mapToDto(farm));
    } catch (error) {
      this.logger.error('Erro na busca por nome', error.stack);
      throw new BadRequestException('Erro ao buscar fazendas por nome.');
    }
  }

  async searchByStateAndCity(state: string, city?: string): Promise<FarmResponseDto[]> {
    this.logger.log(`Buscando fazendas por estado: ${state}` + (city ? ` e cidade: ${city}` : ''));

    try {
      const where = city ? { state, city } : { state };
      const farms = await this.farmRepository.find({
        where,
        relations: ['producer'],
      });

      this.logger.log(`Encontradas ${farms.length} fazendas no filtro de localização.`);
      return farms.map(farm => this.mapToDto(farm));
    } catch (error) {
      this.logger.error('Erro na busca por estado/cidade', error.stack);
      throw new BadRequestException('Erro ao buscar fazendas.');
    }
  }

  async findOne(id: string): Promise<FarmResponseDto> {
    this.logger.log(`Buscando fazenda com ID: ${id}`);

    const farm = await this.getFarmFromCacheOrDb(id);
    this.logger.log(`Fazenda encontrada: ${farm.name} (ID: ${farm.id})`);
    
    return this.mapToDto(farm);
  }

  async update(id: string, updateFarmDto: UpdateFarmDto): Promise<FarmResponseDto> {
    this.logger.log(`Atualizando fazenda ID ${id} com dados:`, updateFarmDto);

    const farm = await this.getFarmFromCacheOrDb(id);

    this.validateAreas(
      updateFarmDto.arableArea ?? farm.arableArea,
      updateFarmDto.vegetationArea ?? farm.vegetationArea,
      updateFarmDto.totalArea ?? farm.totalArea,
    );

    Object.assign(farm, updateFarmDto);

    this.logger.log('Salvando fazenda atualizada no banco de dados...');
    const updatedFarm = await this.farmRepository.save(farm);

    this.logger.log('Atualizando cache da fazenda...');
    await this.updateCache(updatedFarm);

    this.logger.log(`Fazenda ID ${id} atualizada com sucesso.`);
    return this.mapToDto(updatedFarm);
  }

  async remove(id: string): Promise<{ message: string }> {
    this.logger.log(`Removendo fazenda com ID: ${id}`);

    const farm = await this.farmRepository.findOne({ 
      where: { id } 
    });

    if (!farm) {
      this.logger.warn(`Fazenda com ID ${id} não encontrada.`);
      throw new NotFoundException(`Fazenda com ID ${id} não encontrada.`);
    }

    try {
      await this.farmRepository.remove(farm);
      await this.clearCache(id);
      
      this.logger.log(`Fazenda com ID ${id} removida com sucesso.`);
      return { message: 'Fazenda removida com sucesso.' };
    } catch (error) {
      this.logger.error(`Erro ao remover fazenda com ID ${id}`, error.stack);
      throw error;
    }
  }

  private async getFarmFromCacheOrDb(id: string): Promise<Farm> {
    this.logger.log(`Tentando obter fazenda do cache com chave: ${this.getCacheKey(id)}`);

    const cached = await this.redisService.get(this.getCacheKey(id));
    if (cached) {
      this.logger.log('Fazenda encontrada no cache.');
      return JSON.parse(cached);
    }

    this.logger.log('Fazenda não encontrada no cache. Buscando no banco de dados...');
    const farm = await this.farmRepository.findOne({
      where: { id },
      relations: ['producer'],
    });

    if (!farm) {
      this.logger.warn(`Fazenda com ID ${id} não encontrada no banco.`);
      throw new NotFoundException(`Fazenda com ID ${id} não encontrada`);
    }

    this.logger.log('Atualizando cache com dados da fazenda...');
    await this.updateCache(farm);

    return farm;
  }

  private validateAreas(arableArea: number, vegetationArea: number, totalArea: number): void {
    this.logger.log(`Validando áreas: agricultável=${arableArea}, vegetação=${vegetationArea}, total=${totalArea}`);

    if (arableArea + vegetationArea > totalArea) {
      this.logger.warn('Validação falhou: soma das áreas excede área total.');
      throw new BadRequestException(
        'A soma das áreas agricultável e de vegetação não pode ultrapassar a área total da fazenda.',
      );
    }
  }

  private async updateCache(farm: Farm): Promise<void> {
    this.logger.log(`Atualizando cache da fazenda ID ${farm.id}`);
    await this.redisService.set(
      this.getCacheKey(farm.id), 
      JSON.stringify(farm)
    );
  }

  private async clearCache(id: string): Promise<void> {
    this.logger.log(`Removendo cache da fazenda ID ${id}`);
    await this.redisService.del(this.getCacheKey(id));
  }

  private mapToDto(farm: Farm): FarmResponseDto {
    return new FarmResponseDto({
      id: farm.id,
      name: farm.name,
      city: farm.city,
      state: farm.state,
      totalArea: farm.totalArea,
      arableArea: farm.arableArea,
      vegetationArea: farm.vegetationArea
    });
  }
}