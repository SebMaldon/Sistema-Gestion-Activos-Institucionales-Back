import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Bien } from './Bien';
import { Usuario } from './Usuario';

@Entity('Prestamos_Bienes')
export class PrestamoBien {
  @PrimaryGeneratedColumn({ name: 'id_registro_prestamo' })
  id_registro_prestamo!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  @Column({ name: 'id_usuario_registra_prestamo', type: 'int' })
  id_usuario_registra_prestamo!: number;

  @Column({ name: 'id_usuario_registra_entrega', type: 'int', nullable: true })
  id_usuario_registra_entrega?: number;

  @Column({ name: 'fecha_inicio_prestamo', type: 'datetime' })
  fecha_inicio_prestamo!: Date;

  @Column({ name: 'fecha_a_terminar_prestamo', type: 'datetime', nullable: true })
  fecha_a_terminar_prestamo?: Date;

  @Column({ name: 'fecha_entrega', type: 'datetime', nullable: true })
  fecha_entrega?: Date;

  @Column({ name: 'descripcion_prestamo_inicio', type: 'varchar', length: 'max', nullable: true })
  descripcion_prestamo_inicio?: string;

  @Column({ name: 'descripcion_prestamo_finalizacion', type: 'varchar', length: 'max', nullable: true })
  descripcion_prestamo_finalizacion?: string;

  @ManyToOne(() => Bien, (bien) => (bien as any).prestamos)
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_registra_prestamo' })
  usuarioRegistraPrestamo?: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_registra_entrega' })
  usuarioRegistraEntrega?: Usuario;
}
