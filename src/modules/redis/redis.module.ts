import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { LoggerService } from '../../shared/logger/logger.service';

@Global()
@Module({
  providers: [RedisService, LoggerService],
  exports: [RedisService],
})
export class RedisModule {}
