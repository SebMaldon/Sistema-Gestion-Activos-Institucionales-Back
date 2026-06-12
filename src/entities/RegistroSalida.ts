import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from './Usuario';
import { RegistroSalidaBien } from './RegistroSalidaBien';

@Entity('Registro_Salidas')
export class RegistroSalida {
  @PrimaryGeneratedColumn({ name: 'id_salida' })
  id_salida!: number;

  @Column({ name: 'folio', type: 'varchar', length: 50 })
  folio!: string;

  @Column({ name: 'fecha_salida', type: 'date' })
  fecha_salida!: Date;

  @CreateDateColumn({ name: 'fecha_registro', type: 'datetime' })
  fecha_registro!: Date;

  @Column({ name: 'id_usuario_solicitante', type: 'int', nullable: true })
  id_usuario_solicitante?: number;

  @Column({ name: 'matricula', type: 'varchar', length: 50, nullable: true })
  matricula?: string;

  @Column({ name: 'solicitante', type: 'varchar', length: 200 })
  solicitante!: string;

  @Column({ name: 'adscripcion', type: 'varchar', length: 200, nullable: true })
  adscripcion?: string;

  @Column({ name: 'empresa', type: 'varchar', length: 150, nullable: true })
  empresa?: string;

  @Column({ name: 'identificacion', type: 'varchar', length: 100, nullable: true })
  identificacion?: string;

  @Column({ name: 'telefono', type: 'varchar', length: 50, nullable: true })
  telefono?: string;

  @Column({ name: 'motivo', type: 'varchar', length: 'max', nullable: true })
  motivo?: string;

  @Column({ name: 'origen_bienes', type: 'varchar', length: 200, nullable: true })
  origen_bienes?: string;

  @Column({ name: 'responsable', type: 'varchar', length: 200, nullable: true })
  responsable?: string;

  @Column({ name: 'sujeto_devolucion', type: 'bit', default: 0 })
  sujeto_devolucion!: boolean;

  @Column({ name: 'fecha_devolucion', type: 'date', nullable: true })
  fecha_devolucion?: Date;

  @Column({ name: 'observaciones', type: 'varchar', length: 'max', nullable: true })
  observaciones?: string;

  @Column({ name: 'id_usuario_registra', type: 'int', nullable: true })
  id_usuario_registra?: number;

  // --- Relaciones ---

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_usuario_registra' })
  usuarioRegistra?: Usuario;

  @OneToMany(() => RegistroSalidaBien, (bien) => bien.salida, { cascade: true })
  bienes?: RegistroSalidaBien[];
}
