import { Module } from '@nestjs/common';
import { PlantedService } from './planted.service';
import { PlantedController } from './planted.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Planted } from './entities/planted.entity';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [TypeOrmModule.forFeature([Planted]), LoggerModule],
  controllers: [PlantedController],
  providers: [PlantedService],
})
export class PlantedModule {}
