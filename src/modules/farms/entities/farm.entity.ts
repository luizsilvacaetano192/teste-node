import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { Producer } from '../../producers/entities/producer.entity';
import { Crop } from '../../crops/entities/crop.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('farms')
export class Farm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  state: string;

  @Column('decimal', { precision: 10, scale: 2, name: 'total_area' })
  totalArea: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'arable_area' })
  arableArea: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'vegetation_area' })
  vegetationArea: number;

  @ManyToOne(() => Producer, (producer) => producer.farms)
  @ApiProperty({ type: () => Producer })
  producer: Producer;


  @OneToMany(() => Crop, (crop) => crop.farm)
  crops: Crop[];
}
