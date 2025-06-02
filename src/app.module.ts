import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProducersModule } from './modules/producers/producers.module';
import { FarmsModule } from './modules/farms/farms.module';
import { CropsModule } from './modules/crops/crops.module';
import { PlantedModule } from './modules/planteds/planted.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/user.module';
import { RedisService } from './modules/redis/redis.service';
import { LoggerModule } from './shared/logger/logger.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get<boolean>('DB_SYNCHRONIZE', true),
        logging: false,
      }),
    }),
    AuthModule,
    UsersModule,
    ProducersModule,
    FarmsModule,
    CropsModule,
    PlantedModule,
    DashboardModule,
    LoggerModule,
  ],

  providers: [
    RedisService,
  ],

  exports: [
    RedisService,
  ],
})
export class AppModule {}
