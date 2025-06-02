import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farm } from '../farms/entities/farm.entity';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [TypeOrmModule.forFeature([Farm]), LoggerModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
