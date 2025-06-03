import { ApiProperty } from '@nestjs/swagger';

export class CropResponseDto {
  @ApiProperty({ example: '974f42c9-beb5-49fe-be32-414e6a5ed621' })
  id: string;

  @ApiProperty({ example: 'Safra de 2025' })
  name: string;

  @ApiProperty({ example: '2025' })
  year: string;

  @ApiProperty({ example: '974f42c9-beb5-49fe-be32-414e6a5ed621' })
  farmId: string;
}
