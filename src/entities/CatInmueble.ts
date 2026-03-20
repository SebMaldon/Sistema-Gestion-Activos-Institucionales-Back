import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Bien } from './Bien';

@Entity('Cat_Inmuebles')
export class CatInmueble {
  @PrimaryColumn({ name: 'clave_inmueble', type: 'varchar', length: 50 })
  clave_inmueble!: string;

  @Column({ name: 'nombre_ubicacion', type: 'varchar', length: 150 })
  nombre_ubicacion!: string;

  @Column({ name: 'direccion', type: 'varchar', length: 'max', nullable: true })
  direccion?: string;

  @Column({ name: 'jefatura_asignada', type: 'varchar', length: 120, nullable: true })
  jefatura_asignada?: string;

  @OneToMany(() => Bien, (bien) => bien.inmueble)
  bienes?: Bien[];
}
