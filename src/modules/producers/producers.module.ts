import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProducersController } from './producers.controller';
import { ProducersService } from './producers.service';
import { Producer } from './entities/producer.entity';
import { RedisModule } from '../redis/redis.module';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Producer]),
    RedisModule, LoggerModule
  ],
  controllers: [ProducersController],
  providers: [ProducersService],
  exports: [ProducersService],
})
export class ProducersModule {}
