import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Archivos')
export class Archivo {
  @PrimaryGeneratedColumn()
  ID!: number;

  @Column({ type: 'varchar', length: 100 })
  Archivo!: string;
}
