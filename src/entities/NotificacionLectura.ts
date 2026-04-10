import {
  Entity, PrimaryColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { NotificacionMensaje } from './NotificacionMensaje';
import { Usuario } from './Usuario';

/**
 * Tabla: Notificaciones_Lecturas
 * PK compuesta: (id_notificacion, id_usuario)
 * Controla si cada usuario ha leído u ocultado una notificación.
 */
@Entity('Notificaciones_Lecturas')
export class NotificacionLectura {
  @PrimaryColumn({ name: 'id_notificacion', type: 'int' })
  id_notificacion!: number;

  @PrimaryColumn({ name: 'id_usuario', type: 'int' })
  id_usuario!: number;

  /** 0 = No leída, 1 = Ya la vio */
  @Column({ name: 'leida', type: 'bit', default: 0 })
  leida!: boolean;

  @Column({ name: 'fecha_lectura', type: 'datetime', nullable: true })
  fecha_lectura?: Date;

  /** 0 = Visible, 1 = El usuario le dio "Eliminar/X" en su bandeja */
  @Column({ name: 'oculta', type: 'bit', default: 0 })
  oculta!: boolean;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => NotificacionMensaje, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'id_notificacion' })
  notificacion?: NotificacionMensaje;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario?: Usuario;
}
