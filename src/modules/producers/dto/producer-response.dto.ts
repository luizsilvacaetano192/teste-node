import { ApiProperty } from '@nestjs/swagger';
import { FarmResponseDto } from '../../farms/dto/farm-response.dto';

export class ProducerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  document: string;

  @ApiProperty()
  farmCount: number;

  @ApiProperty({ type: () => FarmResponseDto, isArray: true })
  farms: FarmResponseDto[];

  constructor(producer: any) {
    this.id = producer.id;
    this.name = producer.name;
    this.document = producer.document;
    this.farmCount = producer.farmCount ?? (producer.farms?.length ?? 0);
    this.farms = Array.isArray(producer.farms)
      ? producer.farms.map((farm) => new FarmResponseDto(farm))
      : [];
  }
}
