import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller'; // <-- IMPORTANTE
import { AuthService } from './auth.service'; // <-- caso tenha um service
import { UsersModule } from '../modules/users/user.module'; // <- importante
import { LoggerService } from '../shared/logger/logger.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController], 
  providers: [JwtStrategy, AuthService, LoggerService],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
