import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmsService } from './farms.service';
import { FarmsController } from './farms.controller';
import { Farm } from './entities/farm.entity';
import { Producer } from '../producers/entities/producer.entity'; 
import { LoggerModule } from '../../shared/logger/logger.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Farm, Producer]), 
    LoggerModule
  ],
  controllers: [FarmsController],
  providers: [FarmsService],
})
export class FarmsModule {}
