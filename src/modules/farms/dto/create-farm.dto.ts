import { IsUUID, IsString, IsNumber, Min } from 'class-validator';

export class CreateFarmDto {
  @IsString()
  name: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsNumber()
  @Min(0)
  totalArea: number;

  @IsNumber()
  @Min(0)
  arableArea: number;

  @IsNumber()
  @Min(0)
  vegetationArea: number;

  @IsUUID()
  producerId: string;
}
