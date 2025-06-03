// producer.entity.ts
import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';

export enum DocumentType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
}

@Entity('producers')
export class Producer extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  documentNumber: string;

  @ApiProperty({ enum: DocumentType })
  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @ApiProperty()
  @Column()
  name: string;

  @OneToMany(() => Farm, (farm) => farm.producer)
  @ApiProperty({ type: () => [Farm] }) // Swagger precisa disso se estiver no DTO
  farms: Farm[];

}
