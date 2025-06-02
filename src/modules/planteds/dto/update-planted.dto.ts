import { PartialType } from '@nestjs/swagger';
import { CreatePlantedDto } from './create-planted.dto';

export class UpdatePlantedDto extends PartialType(CreatePlantedDto) {}
