import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Usuario } from './Usuario';

@Entity('Bitacora')
export class Bitacora {
  @PrimaryGeneratedColumn({ name: 'id_bitacora' })
  id_bitacora!: number;

  @Column({ name: 'id_usuario', type: 'int' })
  id_usuario!: number;

  /** Ej: 'CREACION' | 'EDICION' | 'ELIMINACION' | 'LOGIN' */
  @Column({ name: 'accion', type: 'varchar', length: 50 })
  accion!: string;

  /** Nombre de la tabla afectada, ej: 'Bienes', 'Usuarios' */
  @Column({ name: 'tabla_afectada', type: 'varchar', length: 100 })
  tabla_afectada!: string;

  /** ID (en string) del registro afectado */
  @Column({ name: 'registro_afectado', type: 'varchar', length: 100, nullable: true })
  registro_afectado?: string;

  /** Descripción textual o JSON con valores viejos/nuevos */
  @Column({ name: 'detalles_movimiento', type: 'nvarchar', length: 'max', nullable: true })
  detalles_movimiento?: string;

  @Column({ name: 'fecha_movimiento', type: 'datetime', default: () => 'GETDATE()' })
  fecha_movimiento!: Date;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario?: Usuario;
}
