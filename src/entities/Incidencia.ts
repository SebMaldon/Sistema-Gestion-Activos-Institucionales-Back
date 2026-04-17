import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Bien } from './Bien';
import { Usuario } from './Usuario';
import { TipoIncidencia } from './TipoIncidencia';
import { Unidad } from './Unidad';

@Entity('Incidencias')
export class Incidencia {
  @PrimaryGeneratedColumn({ name: 'id_incidencia' })
  id_incidencia!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  // Administrador/usuario que crea el reporte en el sistema
  @Column({ name: 'id_usuario_genera_reporte', type: 'int' })
  id_usuario_genera_reporte!: number;

  @Column({ name: 'id_usuario_resuelve', type: 'int', nullable: true })
  id_usuario_resuelve?: number;

  @Column({ name: 'id_tipo_incidencia', type: 'int' })
  id_tipo_incidencia!: number;

  @Column({ name: 'prioridad', type: 'varchar', length: 20, default: 'Media' })
  prioridad!: string;

  @Column({ name: 'descripcion_falla', type: 'nvarchar', length: 'max' })
  descripcion_falla!: string;

  @CreateDateColumn({ name: 'fecha_reporte' })
  fecha_reporte!: Date;

  @Column({ name: 'estatus_reparacion', type: 'varchar', length: 50, default: 'Pendiente' })
  estatus_reparacion!: string;

  @Column({ name: 'resolucion_textual', type: 'nvarchar', length: 'max', nullable: true })
  resolucion_textual?: string;

  @Column({ name: 'fecha_resolucion', type: 'datetime', nullable: true })
  fecha_resolucion?: Date;

  @Column({ name: 'alias', type: 'nvarchar', length: 'max', nullable: true })
  alias?: string;

  @Column({ name: 'requerimiento', type: 'nvarchar', length: 'max', nullable: true })
  requerimiento?: string;

  @Column({ name: 'id_unidad', type: 'int', nullable: true })
  id_unidad?: number;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => Bien, (bien) => bien.incidencias)
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_genera_reporte' })
  usuarioGeneraReporte?: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_resuelve' })
  usuarioResuelve?: Usuario;

  @ManyToOne(() => TipoIncidencia)
  @JoinColumn({ name: 'id_tipo_incidencia' })
  tipoIncidencia?: TipoIncidencia;

  @ManyToOne(() => Unidad)
  @JoinColumn({ name: 'id_unidad' })
  unidad?: Unidad;

  // Will be handled via field resolver
  notas?: any[];
}
