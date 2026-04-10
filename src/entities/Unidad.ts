import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Bien } from './Bien';
import { Usuario } from './Usuario';
import { Ubicacion } from './Ubicacion';

@Entity('unidades')
export class Unidad {
  @PrimaryGeneratedColumn({ name: 'id_unidad' })
  id_unidad!: number;

  @Column({ name: 'No_Ref', type: 'varchar', length: 50 })
  no_ref!: string;

  @Column({ name: 'Nombre', type: 'varchar', length: 200, nullable: true })
  nombre?: string;

  @Column({ name: 'Ip', type: 'varchar', length: 15 })
  ip!: string;

  @Column({ name: 'Encargado', type: 'nvarchar', length: 'max', nullable: true })
  encargado?: string;

  @Column({ name: 'Telefono', type: 'varchar', length: 50, nullable: true })
  telefono?: string;

  @Column({ name: 'clave', type: 'varchar', length: 13, nullable: true })
  clave?: string;

  @Column({ name: 'TipoUnidad', type: 'int', nullable: true })
  tipo_unidad?: number;

  @Column({ name: 'Bits', type: 'int', nullable: true })
  bits?: number;

  @Column({ name: 'IPInit', type: 'int', nullable: true })
  ip_init?: number;

  @Column({ name: 'Estatus', type: 'int', nullable: true })
  estatus?: number;

  @Column({ name: 'Regimen', type: 'int', nullable: true })
  regimen?: number;

  @Column({ name: 'VLAN', type: 'int', nullable: true })
  vlan?: number;

  @Column({ name: 'Monitorear', type: 'int', nullable: true })
  monitorear?: number;

  @Column({ name: 'Proveedor', type: 'varchar', length: 500, nullable: true })
  proveedor?: string;

  @Column({ name: 'FechaMigración', type: 'datetime', nullable: true })
  fecha_migracion?: Date;

  @Column({ name: 'Velocidad', type: 'varchar', length: 50, nullable: true })
  velocidad?: string;

  @Column({ name: 'TipoEnlace', type: 'int', nullable: true })
  tipo_enlace?: number;

  // Relations
  @OneToMany(() => Bien, (bien) => bien.unidad)
  bienes?: Bien[];

  @OneToMany(() => Usuario, (usuario) => usuario.unidad)
  usuarios?: Usuario[];

  @OneToMany(() => Ubicacion, (ub) => ub.unidad)
  ubicaciones?: Ubicacion[];
}
