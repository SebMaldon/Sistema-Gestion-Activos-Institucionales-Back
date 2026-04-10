import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

/**
 * Tabla: Notificaciones_Mensajes
 * Contiene el cuerpo/contenido de cada notificación.
 * tipo_audiencia: 'GLOBAL' | 'ROL' | 'UNIDAD' | 'PERSONAL'
 * id_audiencia:   NULL (GLOBAL), id_rol (ROL), id_unidad (UNIDAD), id_usuario (PERSONAL)
 */
@Entity('Notificaciones_Mensajes')
export class NotificacionMensaje {
  @PrimaryGeneratedColumn({ name: 'id_notificacion' })
  id_notificacion!: number;

  @Column({ name: 'titulo', type: 'varchar', length: 100 })
  titulo!: string;

  @Column({ name: 'mensaje', type: 'nvarchar', length: 'max' })
  mensaje!: string;

  @Column({ name: 'tipo_audiencia', type: 'varchar', length: 20 })
  tipo_audiencia!: string;

  @Column({ name: 'id_audiencia', type: 'int', nullable: true })
  id_audiencia?: number;

  @Column({ name: 'fecha_creacion', type: 'datetime', default: () => 'GETDATE()' })
  fecha_creacion!: Date;
}
