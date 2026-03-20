import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CatModelo } from './CatModelo';

@Entity('marcas')
export class Marca {
  @PrimaryGeneratedColumn({ name: 'clave_marca' })
  clave_marca!: number;

  @Column({ name: 'marca', type: 'varchar', length: 50, nullable: true })
  marca?: string;

  @OneToMany(() => CatModelo, (modelo) => modelo.marca)
  modelos?: CatModelo[];
}
