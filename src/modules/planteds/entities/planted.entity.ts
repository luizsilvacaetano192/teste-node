import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Crop } from '../../crops/entities/crop.entity';

@Entity('planted_cultures')
export class Planted{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Ex: Soja, Milho, Café

  @Column()
  cropId: string;

  @ManyToOne(() => Crop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cropId' })
  crop: Crop;
}
