import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Bien } from './Bien';

@Entity('Cat_UnidadesMedida')
export class CatUnidadMedida {
  @PrimaryGeneratedColumn({ name: 'id_unidad_medida' })
  id_unidad_medida!: number;

  @Column({ name: 'nombre_unidad', type: 'varchar', length: 50 })
  nombre_unidad!: string;

  @Column({ name: 'abreviatura', type: 'varchar', length: 10 })
  abreviatura!: string;

  @OneToMany(() => Bien, (bien) => bien.unidadMedida)
  bienes?: Bien[];
}
