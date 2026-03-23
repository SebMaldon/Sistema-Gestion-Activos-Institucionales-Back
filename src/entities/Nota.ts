import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Bien } from './Bien';
import { Incidencia } from './Incidencia';
import { Usuario } from './Usuario';

@Entity('Notas')
export class Nota {
  @PrimaryGeneratedColumn({ name: 'id_nota' })
  id_nota!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier', nullable: true })
  id_bien?: string;

  @Column({ name: 'id_incidencia', type: 'int', nullable: true })
  id_incidencia?: number;

  @Column({ name: 'id_usuario_autor', type: 'int', nullable: true })
  id_usuario_autor?: number;

  @Column({ name: 'contenido_nota', type: 'varchar', length: 'max' })
  contenido_nota!: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fecha_creacion!: Date;

  @ManyToOne(() => Bien)
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;

  @ManyToOne(() => Incidencia, (incidencia) => incidencia.notas)
  @JoinColumn({ name: 'id_incidencia' })
  incidencia?: Incidencia;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_autor' })
  usuarioAutor?: Usuario;
}
