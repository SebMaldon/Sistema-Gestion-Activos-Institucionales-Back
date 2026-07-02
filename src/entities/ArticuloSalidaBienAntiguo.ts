import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalidaBienAntiguo } from './SalidaBienAntiguo';

@Entity('ArticulosSalidaBienesAntiguo')
export class ArticuloSalidaBienAntiguo {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id!: number;

  @Column({ name: 'IDArticulo', type: 'int' })
  id_articulo!: number;

  @Column({ name: 'Naturaleza', type: 'varchar', length: 10, nullable: true })
  naturaleza?: string;

  @Column({ name: 'Descripción', type: 'varchar', length: 450, nullable: true })
  descripcion?: string;

  @Column({ name: 'Cantidad', type: 'int', nullable: true })
  cantidad?: number;

  @ManyToOne(() => SalidaBienAntiguo, (salida) => salida.articulos, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'IDArticulo' })
  salida?: SalidaBienAntiguo;
}
