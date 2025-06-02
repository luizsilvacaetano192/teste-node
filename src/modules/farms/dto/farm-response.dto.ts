import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProducerResponseDto } from '../../producers/dto/producer-response.dto';

export class FarmResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
    description: 'ID único da fazenda'
  })
  id: string;

  @ApiProperty({
    example: 'Fazenda Santa Maria',
    description: 'Nome da propriedade rural'
  })
  name: string;

  @ApiProperty({
    example: 'Ribeirão Preto',
    description: 'Cidade onde está localizada'
  })
  city: string;

  @ApiProperty({
    example: 'SP',
    description: 'Estado (UF) com 2 caracteres'
  })
  state: string;

  @ApiProperty({
    example: 1500.75,
    description: 'Área total em hectares'
  })
  totalArea: number;

  @ApiProperty({
    example: 1000.25,
    description: 'Área agricultável em hectares'
  })
  arableArea: number;

  @ApiProperty({
    example: 500.50,
    description: 'Área de vegetação em hectares'
  })
  vegetationArea: number;

  @ApiPropertyOptional({
    type: () => ProducerResponseDto,
    description: 'Dados do produtor responsável'
  })
  producer?: ProducerResponseDto;

  @ApiPropertyOptional({
    type: Date,
    example: '2023-01-01T00:00:00.000Z',
    description: 'Data de cadastro no sistema'
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    type: Date,
    example: '2023-01-15T00:00:00.000Z',
    description: 'Data da última atualização'
  })
  updatedAt?: Date;

  constructor(farm: any) {
    this.id = farm.id;
    this.name = farm.name;
    this.city = farm.city;
    this.state = farm.state;
    this.totalArea = farm.totalArea;
    this.arableArea = farm.arableArea;
    this.vegetationArea = farm.vegetationArea;
    this.createdAt = farm.createdAt;
    this.updatedAt = farm.updatedAt;

    if (farm.producer) {
      this.producer = new ProducerResponseDto(farm.producer);
    }
  }
}
