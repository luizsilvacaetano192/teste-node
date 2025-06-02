import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farm } from '../farms/entities/farm.entity';
import { RedisService } from '../redis/redis.service';
import { LoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService
  ) {}

  async getByState() {
    const cacheKey = 'dashboard:byState';
    try {
      this.logger.log('Buscando dados do dashboard por estado...');
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log('Dados por estado encontrados no cache.');
        return JSON.parse(cached);
      }

      this.logger.log('Dados por estado não encontrados no cache, consultando banco de dados...');
      const result = await this.farmRepository
        .createQueryBuilder('farm')
        .select('farm.state', 'state')
        .addSelect('COUNT(DISTINCT farm.id)', 'value')
        .groupBy('farm.state')
        .getRawMany();

      this.logger.log(`Dados por estado obtidos do banco: ${JSON.stringify(result)}`);
      await this.redisService.set(cacheKey, JSON.stringify(result), 600);
      this.logger.log('Dados por estado armazenados no cache.');
      return result;
    } catch (error) {
      this.logger.error('Erro ao buscar dados do dashboard por estado', error.stack);
      throw new InternalServerErrorException('Erro ao buscar dados do dashboard por estado.');
    }
  }

  async getByCulture() {
    const cacheKey = 'dashboard:byCulture';
    try {
      this.logger.log('Buscando dados do dashboard por cultura...');
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log('Dados por cultura encontrados no cache.');
        return JSON.parse(cached);
      }

      this.logger.log('Dados por cultura não encontrados no cache, consultando banco de dados...');
      const result = await this.farmRepository
        .createQueryBuilder('farm')
        .leftJoin('farm.crops', 'crop')
        .leftJoin('crop.planted', 'planted')
        .select('planted.name', 'name')
        .addSelect('COUNT(DISTINCT farm.id)', 'value')
        .where('planted.name IS NOT NULL')
        .groupBy('planted.name')
        .getRawMany();

      this.logger.log(`Dados por cultura obtidos do banco: ${JSON.stringify(result)}`);
      await this.redisService.set(cacheKey, JSON.stringify(result), 600);
      this.logger.log('Dados por cultura armazenados no cache.');
      return result;
    } catch (error) {
      this.logger.error('Erro ao buscar dados do dashboard por cultura', error.stack);
      throw new InternalServerErrorException('Erro ao buscar dados do dashboard por cultura.');
    }
  }

  async getByLandUse() {
    const cacheKey = 'dashboard:byLandUse';
    try {
      this.logger.log('Buscando dados do dashboard por uso da terra...');
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log('Dados por uso da terra encontrados no cache.');
        return JSON.parse(cached);
      }

      this.logger.log('Dados por uso da terra não encontrados no cache, consultando banco de dados...');
      const result = await this.farmRepository
        .createQueryBuilder('farm')
        .select([
          'COALESCE(SUM(farm.arableArea), 0) AS "arableArea"',
          'COALESCE(SUM(farm.vegetationArea), 0) AS "vegetationArea"',
        ])
        .getRawOne();

      const formattedResult = [
        {
          land_use: 'Área Agricultável',
          value: parseFloat(result.arableArea) || 0,
        },
        {
          land_use: 'Área de Vegetação',
          value: parseFloat(result.vegetationArea) || 0,
        },
      ];

      this.logger.log(`Dados por uso da terra obtidos do banco: ${JSON.stringify(formattedResult)}`);
      await this.redisService.set(cacheKey, JSON.stringify(formattedResult), 600);
      this.logger.log('Dados por uso da terra armazenados no cache.');
      return formattedResult;
    } catch (error) {
      this.logger.error('Erro ao buscar dados do dashboard por uso da terra', error.stack);
      throw new InternalServerErrorException('Erro ao buscar dados do dashboard por uso da terra.');
    }
  }

  async getAllDashboardData() {
    try {
      this.logger.log('Buscando todos os dados do dashboard...');
      const [byState, byCulture, byLandUse] = await Promise.all([
        this.getByState(),
        this.getByCulture(),
        this.getByLandUse(),
      ]);

      this.logger.log('Dados completos do dashboard obtidos com sucesso.');
      return {
        byState,
        byCulture,
        byLandUse,
      };
    } catch (error) {
      this.logger.error('Erro ao buscar dados do dashboard completo', error.stack);
      throw new InternalServerErrorException('Erro ao buscar dados do dashboard.');
    }
  }
}
