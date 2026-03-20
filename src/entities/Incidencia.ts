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

  @Column({ name: 'estatus_reparacion', type: 'varchar', length: 30, default: 'PENDIENTE' })
  estatus_reparacion!: string;

  @ManyToOne(() => Bien, (bien) => bien.incidencias)
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;

  @ManyToOne(() => Usuario, (usuario) => usuario.incidencias)
  @JoinColumn({ name: 'id_usuario_reporta' })
  usuarioReporta?: Usuario;
}
