// producer.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';

export enum DocumentType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
}

@Entity('producers')
export class Producer extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  documentNumber: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column()
  name: string;

  @OneToMany(() => Farm, (farm) => farm.producer, {
    eager: true, // <- Importante para carregar automático
    cascade: true,
  })
  farms: Farm[];
}