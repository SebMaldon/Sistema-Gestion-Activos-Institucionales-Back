import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Bien } from './Bien';

@Entity('Cat_CategoriasActivo')
export class CatCategoriaActivo {
  @PrimaryGeneratedColumn({ name: 'id_categoria' })
  id_categoria!: number;

  @Column({ name: 'nombre_categoria', type: 'varchar', length: 100 })
  nombre_categoria!: string;

  @Column({ name: 'es_capitalizable', type: 'bit', default: 1 })
  es_capitalizable!: boolean;

  @Column({ name: 'maneja_serie_individual', type: 'bit', default: 1 })
  maneja_serie_individual!: boolean;

  @OneToMany(() => Bien, (bien) => bien.categoria)
  bienes?: Bien[];
}
