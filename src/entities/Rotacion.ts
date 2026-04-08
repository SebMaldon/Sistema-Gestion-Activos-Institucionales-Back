import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Usuario } from './Usuario';
import { Unidad } from './Unidad';

@Entity('rotacion')
export class Rotacion {
  @PrimaryGeneratedColumn({ name: 'id_rotacion' })
  id_rotacion!: number;

  @Column({ name: 'id_usuario', type: 'int' })
  id_usuario!: number;

  @Column({ name: 'id_unidad', type: 'int' })
  id_unidad!: number;

  @Column({ name: 'estatus', type: 'bit', default: 1 })
  estatus!: boolean;

  @Column({ name: 'posicion', type: 'int', default: 0 })
  posicion!: number;

  /**
   * Puntero de cola: solo UN registro por id_unidad puede tener este flag en 1.
   * Indica quién tiene el turno actual para recibir la próxima incidencia.
   * Se agrega con: ALTER TABLE rotacion ADD es_turno_actual BIT DEFAULT 0
   */
  @Column({ name: 'es_turno_actual', type: 'bit', default: 0 })
  es_turno_actual!: boolean;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => Usuario, { nullable: false, eager: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario?: Usuario;

  @ManyToOne(() => Unidad, { nullable: false, eager: false })
  @JoinColumn({ name: 'id_unidad' })
  unidad?: Unidad;
}
