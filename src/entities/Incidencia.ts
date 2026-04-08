import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Bien } from './Bien';
import { Usuario } from './Usuario';
import { TipoIncidencia } from './TipoIncidencia';

@Entity('Incidencias')
export class Incidencia {
  @PrimaryGeneratedColumn({ name: 'id_incidencia' })
  id_incidencia!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  // Administrador/usuario que crea el reporte en el sistema
  @Column({ name: 'id_usuario_genera_reporte', type: 'int' })
  id_usuario_genera_reporte!: number;

  // Usuario final que reporta la falla (puede ser el mismo que genera el reporte)
  @Column({ name: 'id_usuario_reporta', type: 'int' })
  id_usuario_reporta!: number;

  @Column({ name: 'id_usuario_asignado', type: 'int', nullable: true })
  id_usuario_asignado?: number;

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

  @Column({ name: 'unidad', type: 'varchar', length: 60, nullable: true })
  unidad?: string;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => Bien, (bien) => bien.incidencias)
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_genera_reporte' })
  usuarioGeneraReporte?: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.incidencias)
  @JoinColumn({ name: 'id_usuario_reporta' })
  usuarioReporta?: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_asignado' })
  usuarioAsignado?: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_resuelve' })
  usuarioResuelve?: Usuario;

  @ManyToOne(() => TipoIncidencia)
  @JoinColumn({ name: 'id_tipo_incidencia' })
  tipoIncidencia?: TipoIncidencia;

  // Will be handled via field resolver
  notas?: any[];
}
