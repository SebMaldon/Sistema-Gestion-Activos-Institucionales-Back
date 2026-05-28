import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Bien } from './Bien';
import { Usuario } from './Usuario';

@Entity('solicitudes_cambio')
export class SolicitudCambio {
  @PrimaryGeneratedColumn({ name: 'id' })
  id!: number;

  @Column({ name: 'bien_id', type: 'uniqueidentifier', nullable: true })
  bien_id?: string;

  @Column({ name: 'usuario_solicitante_id', type: 'int' })
  usuario_solicitante_id!: number;

  @Column({ name: 'datos_nuevos', type: 'simple-json' })
  datos_nuevos!: Record<string, any>;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado!: string;

  @Column({ name: 'fecha_solicitud', type: 'datetime', default: () => 'GETDATE()' })
  fecha_solicitud!: Date;

  @Column({ name: 'usuario_aprobador_id', type: 'int', nullable: true })
  usuario_aprobador_id?: number;

  @Column({ name: 'fecha_resolucion', type: 'datetime', nullable: true })
  fecha_resolucion?: Date;

  @Column({ name: 'comentarios', type: 'nvarchar', length: 'MAX', nullable: true })
  comentarios?: string;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => Bien)
  @JoinColumn({ name: 'bien_id' })
  bien?: Bien;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_solicitante_id' })
  solicitante?: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_aprobador_id' })
  aprobador?: Usuario;
}
