import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { Planted } from '../../planteds/entities/planted.entity';

@Entity()
export class Crop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  year: string;

  @Column()
  farmId: string;

  @ManyToOne(() => Farm, (farm) => farm.crops)
  farm: Farm;

  @OneToMany(() => Planted, (planted) => planted.crop)
  planted: Planted[];
}
