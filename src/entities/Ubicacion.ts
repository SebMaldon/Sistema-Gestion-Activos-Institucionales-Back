import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Inmueble } from './Inmueble';
import { Bien } from './Bien';

// Tabla: Ubicaciones — departamentos/áreas por unidad física
// id_unidad es varchar(50) FK a unidades(clave)
@Entity('Ubicaciones')
export class Ubicacion {
  @PrimaryGeneratedColumn({ name: 'id_ubicacion' })
  id_ubicacion!: number;

  @Column({ name: 'id_unidad', type: 'varchar', length: 50 })
  id_unidad!: string;

  @Column({ name: 'nombre_ubicacion', type: 'varchar', length: 150 })
  nombre_ubicacion!: string;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => Inmueble, { nullable: true })
  @JoinColumn({ name: 'id_unidad', referencedColumnName: 'clave' })
  unidad?: Inmueble;

  @OneToMany(() => Bien, (b) => b.ubicacion)
  bienes?: Bien[];
}
