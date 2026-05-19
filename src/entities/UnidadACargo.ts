import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Inmueble } from './Inmueble';
import { Usuario } from './Usuario';

@Entity('Unidad_A_Cargo')
export class UnidadACargo {
  @PrimaryColumn({ name: 'id_unidad_cargo', type: 'varchar', length: 50 })
  id_unidad_cargo!: string;

  @PrimaryColumn({ name: 'id_rol_empleado', type: 'int' })
  id_rol_empleado!: number;

  @PrimaryColumn({ name: 'id_usuario', type: 'int' })
  id_usuario!: number;

  @ManyToOne(() => Inmueble, inmueble => inmueble.unidadesACargo)
  @JoinColumn({ name: 'id_unidad_cargo', referencedColumnName: 'clave' })
  inmueble?: Inmueble;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id_usuario' })
  usuario?: Usuario;
}
