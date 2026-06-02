import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Inmueble } from './Inmueble';
import { Ubicacion } from './Ubicacion';
import { Archivo } from './Archivo';

@Entity('Mesa_Correspondencia')
export class MesaCorrespondencia {
  @PrimaryColumn({ type: 'int' })
  Folio!: number;

  @Column({ type: 'varchar', length: 25, nullable: true })
  NoOficio?: string;

  @Column({ type: 'datetime', nullable: true })
  FechaRecepcion?: Date;

  @Column({ type: 'datetime', nullable: true })
  FechaOficio?: Date;

  @Column({ type: 'varchar', length: 'MAX', nullable: true })
  Remitente?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  Clave_unidad?: string;

  @Column({ type: 'int', nullable: true })
  id_ubicacion?: number;

  @Column({ type: 'varchar', length: 'MAX', nullable: true })
  Descripcion?: string;

  @Column({ type: 'int', nullable: true })
  Tipo?: number;

  @Column({ type: 'int', nullable: true })
  Archivo?: number;

  @ManyToOne(() => Inmueble)
  @JoinColumn({ name: 'Clave_unidad', referencedColumnName: 'clave' })
  unidad?: Inmueble;

  @ManyToOne(() => Ubicacion)
  @JoinColumn({ name: 'id_ubicacion', referencedColumnName: 'id_ubicacion' })
  ubicacion?: Ubicacion;

  @ManyToOne(() => Archivo)
  @JoinColumn({ name: 'Archivo', referencedColumnName: 'ID' })
  archivo_ref?: Archivo;
}

