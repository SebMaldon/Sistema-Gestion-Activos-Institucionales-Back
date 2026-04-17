import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Bien } from './Bien';
import { Proveedor } from './Proveedor';

@Entity('Garantias')
export class Garantia {
  @PrimaryGeneratedColumn({ name: 'id_garantia' })
  id_garantia!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fecha_inicio?: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fecha_fin!: Date;

  @Column({ name: 'id_proveedor', type: 'int', nullable: true })
  id_proveedor?: number;

  @Column({ name: 'estado_garantia', type: 'varchar', length: 20, default: 'VIGENTE' })
  estado_garantia!: string;

  @ManyToOne(() => Bien, (bien) => bien.garantias)
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;

  @ManyToOne(() => Proveedor)
  @JoinColumn({ name: 'id_proveedor' })
  proveedorObj?: Proveedor;
}
