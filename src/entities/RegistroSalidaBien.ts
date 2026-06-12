import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RegistroSalida } from './RegistroSalida';
import { Bien } from './Bien';

@Entity('Registro_Salida_Bienes')
export class RegistroSalidaBien {
  @PrimaryGeneratedColumn({ name: 'id_salida_bien' })
  id_salida_bien!: number;

  @Column({ name: 'id_salida', type: 'int' })
  id_salida!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier', nullable: true })
  id_bien?: string;

  @Column({ name: 'cantidad_o_id', type: 'varchar', length: 150, nullable: true })
  cantidad_o_id?: string;

  @Column({ name: 'naturaleza', type: 'varchar', length: 20, nullable: true })
  naturaleza?: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 'max', nullable: true })
  descripcion?: string;

  // --- Relaciones ---

  @ManyToOne(() => RegistroSalida, (salida) => salida.bienes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_salida' })
  salida!: RegistroSalida;

  @ManyToOne(() => Bien, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_bien' })
  bienRef?: Bien;
}
