import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  Length, 
  Matches, 
  ValidateIf,
  IsArray,
  IsOptional
} from 'class-validator';

// Tipos de documentos válidos para cadastro
export enum DocumentType {
  CPF = 'CPF',   // Para pessoas físicas
  CNPJ = 'CNPJ', // Para pessoas jurídicas
}

export class CreateProducerDto {
  @ApiProperty({
    example: 'João da Silva',
    description: 'Nome completo do produtor rural'
  })
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  name: string;

  @ApiProperty({
    example: '12345678900',
    description: 'Número do documento sem pontuação'
  })
  @IsString({ message: 'O documento deve ser um texto' })
  @IsNotEmpty({ message: 'O documento não pode estar vazio' })
  // Validação condicional para CPF (11 dígitos)
  @ValidateIf(o => o.documentType === DocumentType.CPF)
  @Length(11, 11, { message: 'CPF deve ter 11 dígitos' })
  // Validação condicional para CNPJ (14 dígitos)
  @ValidateIf(o => o.documentType === DocumentType.CNPJ)
  @Length(14, 14, { message: 'CNPJ deve ter 14 dígitos' })
  @Matches(/^\d+$/, { message: 'Apenas números são permitidos' })
  documentNumber: string;

  @ApiProperty({
    example: DocumentType.CPF,
    enum: DocumentType,
    description: 'Tipo de documento do produtor'
  })
  @IsEnum(DocumentType, { message: 'Tipo de documento inválido' })
  documentType: DocumentType;

  @ApiPropertyOptional({
    type: [String],
    example: ['fazenda-1-uuid', 'fazenda-2-uuid'],
    description: 'IDs das fazendas vinculadas (opcional)'
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  farmsIds?: string[];
}