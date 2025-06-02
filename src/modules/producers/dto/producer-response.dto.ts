import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from './create-producer.dto';
import { FarmResponseDto } from '../../farms/dto/farm-response.dto';

export class ProducerResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
    description: 'ID único do produtor gerado automaticamente',
  })
  id: string;

  @ApiProperty({
    example: 'João da Silva',
    description: 'Nome completo do produtor rural',
  })
  name: string;

  @ApiProperty({
    example: '12345678900',
    description: 'Número do documento (CPF/CNPJ) sem pontuação',
  })
  documentNumber: string;

  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.CPF,
    description: 'Tipo de documento do produtor',
  })
  documentType: DocumentType;

  @ApiPropertyOptional({
    type: [FarmResponseDto],
    description: 'Lista de fazendas vinculadas ao produtor',
  })
  farms?: FarmResponseDto[];

  @ApiPropertyOptional({
    type: Date,
    example: '2023-01-01T00:00:00.000Z',
    description: 'Data de criação do registro',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    type: Date,
    example: '2023-01-02T00:00:00.000Z',
    description: 'Data da última atualização do registro',
  })
  updatedAt?: Date;

  constructor(producer: any) {
    this.id = producer.id;
    this.name = producer.name;
    this.documentNumber = producer.documentNumber;
    this.documentType = producer.documentType;
    this.farms = producer.farms?.map((farm: any) => new FarmResponseDto(farm));
    this.createdAt = producer.createdAt;
    this.updatedAt = producer.updatedAt;
  }
}
