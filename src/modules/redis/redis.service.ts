import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { LoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor(private readonly logger: LoggerService) {}

  async onModuleInit(): Promise<void> {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = Number(process.env.REDIS_PORT || '6379');

    this.client = createClient({
      url: `redis://${redisHost}:${redisPort}`,
    });

    this.client.on('error', (err) => {
      this.logger.error(`[Redis] Erro de conexão:`, err);
    });

    try {
      await this.client.connect();
      this.logger.log(`[Redis] Conexão estabelecida em ${redisHost}:${redisPort}`);
    } catch (error) {
      this.logger.error(`[Redis] Falha ao conectar`, error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      // await this.client.disconnect(); // opcional
      this.logger.log('[Redis] Conexão encerrada');
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async set(key: string, value: string, ttlInSeconds?: number): Promise<void> {
    try {
      if (ttlInSeconds) {
        await this.client.set(key, value, { EX: ttlInSeconds });
      } else {
        await this.client.set(key, value);
      }
      this.logger.debug(`[Redis] SET chave="${key}"`);
    } catch (error) {
      this.logger.error(`[Redis] Erro no SET da chave "${key}"`, error);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      this.logger.debug(`[Redis] GET chave="${key}"`);
      return value;
    } catch (error) {
      this.logger.error(`[Redis] Erro no GET da chave "${key}"`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
      this.logger.debug(`[Redis] DEL chave="${key}"`);
    } catch (error) {
      this.logger.error(`[Redis] Erro no DEL da chave "${key}"`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        this.logger.debug(`[Redis] DEL padrão="${pattern}" (${keys.length} chaves)`);
      } else {
        this.logger.debug(`[Redis] Nenhuma chave encontrada com o padrão "${pattern}"`);
      }
    } catch (error) {
      this.logger.error(`[Redis] Erro ao deletar padrão "${pattern}"`, error);
    }
  }
}
