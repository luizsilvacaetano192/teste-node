import { ApiProperty } from '@nestjs/swagger';

export class CropResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'Safra de 2025' })
  name: string;

  @ApiProperty({ example: '2025' })
  year: string;

  @ApiProperty({ example: '2' })
  farmId: string;
}
