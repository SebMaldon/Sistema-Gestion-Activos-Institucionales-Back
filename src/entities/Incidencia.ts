import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Bien } from './Bien';
import { Usuario } from './Usuario';

@Entity('Incidencias')
export class Incidencia {
  @PrimaryGeneratedColumn({ name: 'id_incidencia' })
  id_incidencia!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  @Column({ name: 'id_usuario_reporta', type: 'int' })
  id_usuario_reporta!: number;

  @Column({ name: 'descripcion_falla', type: 'nvarchar', length: 'max' })
  descripcion_falla!: string;

  @CreateDateColumn({ name: 'fecha_reporte' })
  fecha_reporte!: Date;

  @Column({ name: 'estatus_reparacion', type: 'varchar', length: 50, default: 'Pendiente' })
  estatus_reparacion!: string;

  @Column({ name: 'id_usuario_asignado', type: 'int', nullable: true })
  id_usuario_asignado?: number;

  @Column({ name: 'id_usuario_resuelve', type: 'int', nullable: true })
  id_usuario_resuelve?: number;

  @Column({ name: 'resolucion_textual', type: 'nvarchar', length: 'max', nullable: true })
  resolucion_textual?: string;

  @Column({ name: 'fecha_resolucion', type: 'datetime', nullable: true })
  fecha_resolucion?: Date;

  @Column({ name: 'unidad', type: 'varchar', length: 60, nullable: true })
  unidad?: string;

  @ManyToOne(() => Bien, (bien) => bien.incidencias)
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;

  @ManyToOne(() => Usuario, (usuario) => usuario.incidencias)
  @JoinColumn({ name: 'id_usuario_reporta' })
  usuarioReporta?: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_asignado' })
  usuarioAsignado?: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_resuelve' })
  usuarioResuelve?: Usuario;

  // Added relation to Nota (since a note defines @ManyToOne back to Incidencia)
  notas?: any[]; // Will be handled via custom resolver or OneToMany if imported (we'll rely on resolvers for now to avoid circular dependency complex setup, or just leave it out of TypeORM columns if not strict).
}
