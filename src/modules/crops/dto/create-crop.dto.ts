import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCropDto {
  @ApiProperty({
    description: 'Nome da safra',
    example: 'Safra de 2025',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Ano da safra',
    example: '2025',
  })
  @IsString()
  @IsNotEmpty()
  year: string;

  @ApiProperty({
    description: 'ID da fazenda relacionada à safra',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  farmId: string;
}
