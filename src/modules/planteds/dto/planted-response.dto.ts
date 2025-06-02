import { ApiProperty } from '@nestjs/swagger';
import { CropResponseDto } from '../../crops/dto/crop-response.dto'; // ajuste o path conforme sua estrutura

export class PlantedResponseDto {
  @ApiProperty({ example: 'uuid-da-cultura-plantada' })
  id: string;

  @ApiProperty({ example: 'Soja' })
  name: string;

  @ApiProperty({ example: 'uuid-da-safra' })
  cropId: string;

  @ApiProperty({ type: () => CropResponseDto, nullable: true })
  crop: CropResponseDto | null;
}
