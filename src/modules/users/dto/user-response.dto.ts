import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'ID do usuário' })
  id: number;

  @ApiProperty({ example: 'luiz_caetano', description: 'Nome de usuário' })
  username: string;

  constructor(partial: Partial<User>) {  // <<< aqui o tipo muda
    Object.assign(this, partial);
  }
}
