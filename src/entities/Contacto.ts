import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Inmueble } from './Inmueble';

@Entity('Contactos')
export class Contacto {
  @PrimaryGeneratedColumn({ name: 'id_contacto' })
  id_contacto!: number;

  @Column({ name: 'id_unidad', type: 'varchar', length: 50, nullable: true })
  id_unidad?: string;

  @Column({ name: 'id_proveedor', type: 'int', nullable: true })
  id_proveedor?: number;

  @Column({ name: 'id_segmento', type: 'int', nullable: true })
  id_segmento?: number;

  @Column({ name: 'contacto', type: 'varchar', length: 200 })
  contacto!: string;

  @Column({ name: 'tipo_contacto', type: 'varchar', length: 100 })
  tipo_contacto!: string;

  @ManyToOne(() => Inmueble, inmueble => inmueble.contactos)
  @JoinColumn({ name: 'id_unidad', referencedColumnName: 'clave' })
  inmueble?: Inmueble;
}
