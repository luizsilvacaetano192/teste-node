import { IsString, IsNotEmpty, IsUUID} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlantedDto {
  @ApiProperty({ example: 'Soja' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'uuid-da-safra' })
  @IsUUID()
  @IsNotEmpty()
  cropId: string;
}
