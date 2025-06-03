import { Expose } from 'class-transformer';

export class FarmResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  city: string;

  @Expose()
  state: string;

  @Expose()
  totalArea: number;

  @Expose()
  arableArea: number;

  @Expose()
  vegetationArea: number;

  constructor(partial: Partial<FarmResponseDto>) {
    Object.assign(this, partial);
  }
}
