import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar usuário e gerar tokens JWT' })
  @ApiResponse({
    status: 200,
    description: 'Tokens gerados com sucesso',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiBody({
    description: 'Credenciais de login',
    type: LoginDto,
    examples: {
      exemploPadrao: {
        summary: 'Login de teste',
        value: {
          username: 'luiz_caetano',
          password: 'senha123',
        },
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const tokens = await this.authService.login(
      loginDto.username,
      loginDto.password,
    );
    if (!tokens) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return tokens;
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar novo access_token com base no refresh_token' })
  @ApiResponse({
    status: 200,
    description: 'Novo access_token gerado com sucesso',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado' })
  @ApiBody({
    description: 'Refresh token JWT',
    type: RefreshTokenDto,
  })
  async refreshToken(
    @Body() body: RefreshTokenDto,
  ): Promise<{ access_token: string }> {
    if (!body.refresh_token) {
      throw new UnauthorizedException('Refresh token ausente');
    }
    return this.authService.refreshToken(body.refresh_token);
  }
}
