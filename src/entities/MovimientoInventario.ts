import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Bien } from './Bien';
import { Usuario } from './Usuario';

@Entity('Movimientos_Inventario')
export class MovimientoInventario {
  @PrimaryGeneratedColumn({ name: 'id_movimiento' })
  id_movimiento!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  @Column({ name: 'id_usuario_autoriza', type: 'int' })
  id_usuario_autoriza!: number;

  @Column({ name: 'tipo_movimiento', type: 'varchar', length: 30, nullable: true })
  tipo_movimiento?: string;

  @Column({ name: 'cantidad_movida', type: 'decimal', precision: 10, scale: 2, default: 1 })
  cantidad_movida!: number;

  @Column({ name: 'num_remision', type: 'varchar', length: 50, nullable: true })
  num_remision?: string;

  @CreateDateColumn({ name: 'fecha_movimiento' })
  fecha_movimiento!: Date;

  @Column({ name: 'origen', type: 'varchar', length: 100, nullable: true })
  origen?: string;

  @Column({ name: 'destino', type: 'varchar', length: 100, nullable: true })
  destino?: string;

  @Column({ name: 'url_formato_pdf', type: 'varchar', length: 255, nullable: true })
  url_formato_pdf?: string;

  @ManyToOne(() => Bien, (bien) => bien.movimientos)
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;

  @ManyToOne(() => Usuario, (usuario) => usuario.movimientosAutorizados)
  @JoinColumn({ name: 'id_usuario_autoriza' })
  usuarioAutoriza?: Usuario;
}
