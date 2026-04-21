import {
  Entity, PrimaryColumn, Column,
  ManyToOne, JoinColumn, OneToOne, OneToMany,
} from 'typeorm';
import { CatCategoriaActivo } from './CatCategoriaActivo';
import { CatUnidadMedida } from './CatUnidadMedida';
import { CatInmueble } from './CatInmueble';
import { CatModelo } from './CatModelo';
import { Usuario } from './Usuario';
import { Unidad } from './Unidad';
import { Ubicacion } from './Ubicacion';
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

  @Column({ name: 'id_unidad_medida', type: 'int' })
  id_unidad_medida!: number;

  @Column({ name: 'id_unidad', type: 'int', nullable: true })
  id_unidad?: number;

  @Column({ name: 'id_ubicacion', type: 'int', nullable: true })
  id_ubicacion?: number;

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

  // FK a la tabla inmuebles (tabla legacy con más detalle)
  @Column({ name: 'clave_inmueble_ref', type: 'varchar', length: 50, nullable: true })
  clave_inmueble_ref?: string;

  // Autogenerado por trigger (unidades.clave + inmuebles.clave)
  @Column({ name: 'clave_presupuestal', type: 'varchar', length: 150, nullable: true })
  clave_presupuestal?: string;

  @Column({ name: 'clave_modelo', type: 'varchar', length: 30, nullable: true })
  clave_modelo?: string;

  @Column({ name: 'id_usuario_resguardo', type: 'int', nullable: true })
  id_usuario_resguardo?: number;

  @Column({ name: 'fecha_adquisicion', type: 'date', nullable: true })
  fecha_adquisicion?: Date;

  @Column({ name: 'fecha_actualizacion', type: 'datetime', default: () => 'GETDATE()' })
  fecha_actualizacion!: Date;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => CatCategoriaActivo, (cat) => cat.bienes)
  @JoinColumn({ name: 'id_categoria' })
  categoria?: CatCategoriaActivo;

  @ManyToOne(() => CatUnidadMedida, (u) => u.bienes)
  @JoinColumn({ name: 'id_unidad_medida' })
  unidadMedida?: CatUnidadMedida;

  @ManyToOne(() => Unidad, (u) => u.bienes, { nullable: true })
  @JoinColumn({ name: 'id_unidad' })
  unidad?: Unidad;

  @ManyToOne(() => Ubicacion, (ub) => ub.bienes, { nullable: true })
  @JoinColumn({ name: 'id_ubicacion' })
  ubicacion?: Ubicacion;

  @ManyToOne(() => CatInmueble, (i) => i.bienes, { nullable: true })
  @JoinColumn({ name: 'clave_inmueble_ref' })
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
