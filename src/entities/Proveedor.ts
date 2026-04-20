import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Proveedores')
export class Proveedor {
  @PrimaryGeneratedColumn({ name: 'id_proveedor' })
  id_proveedor!: number;

  @Column({ name: 'nombre_proveedor', type: 'varchar', length: 150 })
  nombre_proveedor!: string;

  @Column({ name: 'informacion_contacto', type: 'varchar', length: 'max', nullable: true })
  informacion_contacto?: string;
}
