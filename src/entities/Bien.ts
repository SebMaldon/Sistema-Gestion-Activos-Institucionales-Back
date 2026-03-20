import {
  Entity, PrimaryColumn, Column,
  ManyToOne, JoinColumn, OneToOne, OneToMany, CreateDateColumn,
} from 'typeorm';
import { CatCategoriaActivo } from './CatCategoriaActivo';
import { CatUnidadMedida } from './CatUnidadMedida';
import { CatInmueble } from './CatInmueble';
import { CatModelo } from './CatModelo';
import { Usuario } from './Usuario';
import { EspecificacionTI } from './EspecificacionTI';
import { Garantia } from './Garantia';
import { Incidencia } from './Incidencia';
import { MovimientoInventario } from './MovimientoInventario';

@Entity('Bienes')
export class Bien {
  @PrimaryColumn({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  @Column({ name: 'id_categoria', type: 'int' })
  id_categoria!: number;

  @Column({ name: 'id_unidad', type: 'int' })
  id_unidad!: number;

  @Column({ name: 'num_serie', type: 'varchar', length: 50, nullable: true })
  num_serie?: string;

  @Column({ name: 'num_inv', type: 'varchar', length: 50, nullable: true })
  num_inv?: string;

  @Column({ name: 'cantidad', type: 'decimal', precision: 10, scale: 2, default: 1 })
  cantidad!: number;

  @Column({ name: 'estatus_operativo', type: 'varchar', length: 50, default: 'ACTIVO' })
  estatus_operativo!: string;

  @Column({ name: 'qr_hash', type: 'varchar', length: 255, nullable: true, unique: true })
  qr_hash?: string;

  @Column({ name: 'clave_inmueble', type: 'varchar', length: 50, nullable: true })
  clave_inmueble?: string;

  @Column({ name: 'clave_modelo', type: 'varchar', length: 30, nullable: true })
  clave_modelo?: string;

  @Column({ name: 'id_usuario_resguardo', type: 'int', nullable: true })
  id_usuario_resguardo?: number;

  @Column({ name: 'fecha_adquisicion', type: 'date', nullable: true })
  fecha_adquisicion?: Date;

  @CreateDateColumn({ name: 'fecha_actualizacion' })
  fecha_actualizacion!: Date;

  @Column({ name: 'observaciones', type: 'nvarchar', length: 'max', nullable: true })
  observaciones?: string;

  // Relations
  @ManyToOne(() => CatCategoriaActivo, (cat) => cat.bienes)
  @JoinColumn({ name: 'id_categoria' })
  categoria?: CatCategoriaActivo;

  @ManyToOne(() => CatUnidadMedida, (u) => u.bienes)
  @JoinColumn({ name: 'id_unidad' })
  unidadMedida?: CatUnidadMedida;

  @ManyToOne(() => CatInmueble, (i) => i.bienes, { nullable: true })
  @JoinColumn({ name: 'clave_inmueble' })
  inmueble?: CatInmueble;

  @ManyToOne(() => CatModelo, (m) => m.bienes, { nullable: true })
  @JoinColumn({ name: 'clave_modelo' })
  modelo?: CatModelo;

  @ManyToOne(() => Usuario, (u) => u.bienesResguardados, { nullable: true })
  @JoinColumn({ name: 'id_usuario_resguardo' })
  usuarioResguardo?: Usuario;

  @OneToOne(() => EspecificacionTI, (spec) => spec.bien, { nullable: true })
  especificacionTI?: EspecificacionTI;

  @OneToMany(() => Garantia, (g) => g.bien)
  garantias?: Garantia[];

  @OneToMany(() => Incidencia, (inc) => inc.bien)
  incidencias?: Incidencia[];

  @OneToMany(() => MovimientoInventario, (mov) => mov.bien)
  movimientos?: MovimientoInventario[];
}
