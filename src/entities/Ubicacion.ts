import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Unidad } from './Unidad';
import { Bien } from './Bien';

@Entity('Ubicaciones')
export class Ubicacion {
  @PrimaryGeneratedColumn({ name: 'id_ubicacion' })
  id_ubicacion!: number;

  @Column({ name: 'id_unidad', type: 'int' })
  id_unidad!: number;

  @Column({ name: 'nombre_ubicacion', type: 'varchar', length: 150 })
  nombre_ubicacion!: string;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => Unidad, (u) => u.ubicaciones)
  @JoinColumn({ name: 'id_unidad' })
  unidad?: Unidad;

  @OneToMany(() => Bien, (b) => b.ubicacion)
  bienes?: Bien[];
}
