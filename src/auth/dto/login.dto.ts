// src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'usuario123',
    description: 'Nome de usuário do sistema',
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'senhaSecreta123',
    description: 'Senha do usuário',
  })
  @IsString()
  password: string;
}
