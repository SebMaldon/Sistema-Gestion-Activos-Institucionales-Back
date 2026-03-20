import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Bien } from './Bien';

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

  @Column({ name: 'proveedor', type: 'varchar', length: 100, nullable: true })
  proveedor?: string;

  @Column({ name: 'estado_garantia', type: 'varchar', length: 20, default: 'VIGENTE' })
  estado_garantia!: string;

  @ManyToOne(() => Bien, (bien) => bien.garantias)
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;
}
