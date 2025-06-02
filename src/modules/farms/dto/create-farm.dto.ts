import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsUUID, Min, Max, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFarmDto {
  @ApiProperty({
    example: 'Fazenda São João',
    description: 'Nome oficial da propriedade rural'
  })
  @IsString({ message: 'O nome deve ser um texto válido' })
  @IsNotEmpty({ message: 'O nome da fazenda é obrigatório' })
  name: string;

  @ApiProperty({
    example: 'São Paulo',
    description: 'Município onde está localizada a fazenda'
  })
  @IsString({ message: 'A cidade deve ser um texto válido' })
  @IsNotEmpty({ message: 'A cidade é obrigatória' })
  city: string;

  @ApiProperty({
    example: 'SP',
    description: 'Sigla do estado (UF) onde está a fazenda'
  })
  @IsString({ message: 'O estado deve ser um texto válido' })
  @IsNotEmpty({ message: 'O estado é obrigatório' })
  @Length(2, 2, { message: 'O estado deve ter exatamente 2 caracteres' })
  state: string;

  @ApiProperty({
    example: 1000,
    description: 'Área total da propriedade em hectares',
    minimum: 1
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'A área total deve ser um número' })
  @Min(1, { message: 'A área total não pode ser menor que 1 hectare' })
  totalArea: number;

  @ApiProperty({
    example: 500,
    description: 'Área agricultável em hectares',
    minimum: 0
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'A área agricultável deve ser um número' })
  @Min(0, { message: 'A área agricultável não pode ser negativa' })
  arableArea: number;

  @ApiProperty({
    example: 300,
    description: 'Área de vegetação nativa em hectares',
    minimum: 0
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'A área de vegetação deve ser um número' })
  @Min(0, { message: 'A área de vegetação não pode ser negativa' })
  vegetationArea: number;

  @ApiProperty({
    example: '6f4e3f88-2c7c-4f8c-91c2-0123456789ab',
    description: 'ID do produtor responsável pela fazenda'
  })
  @IsString({ message: 'O ID do produtor deve ser um texto válido' })
  @IsNotEmpty({ message: 'O ID do produtor é obrigatório' })
  @IsUUID('4', { message: 'O ID do produtor deve ser um UUID válido' })
  producerId: string;
}