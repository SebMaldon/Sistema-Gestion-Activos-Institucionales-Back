import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { ArticuloSalidaBienAntiguo } from './ArticuloSalidaBienAntiguo';

@Entity('SalidaBienesAntiguo')
export class SalidaBienAntiguo {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id!: number;

  @Column({ name: 'Responsable', type: 'varchar', length: 350, nullable: true })
  responsable?: string;

  @Column({ name: 'M_Responsable', type: 'varchar', length: 50, nullable: true })
  m_responsable?: string;

  @Column({ name: 'P_Responsable', type: 'varchar', length: 350, nullable: true })
  p_responsable?: string;

  @Column({ name: 'Solicitante', type: 'varchar', length: 350, nullable: true })
  solicitante?: string;

  @Column({ name: 'M_Solicitante', type: 'varchar', length: 50, nullable: true })
  m_solicitante?: string;

  @Column({ name: 'P_Solicitante', type: 'varchar', length: 350, nullable: true })
  p_solicitante?: string;

  @Column({ name: 'Fecha', type: 'datetime', nullable: true })
  fecha?: Date;

  @Column({ name: 'Identificación', type: 'varchar', length: 50, nullable: true })
  identificacion?: string;

  @Column({ name: 'Teléfono', type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ name: 'Devolución', type: 'varchar', length: 2, nullable: true })
  devolucion?: string;

  @Column({ name: 'Para_Su', type: 'varchar', length: 50, nullable: true })
  para_su?: string;

  @Column({ name: 'EstadoFisico', type: 'varchar', length: 450, nullable: true })
  estado_fisico?: string;

  @Column({ name: 'FechaDevolución', type: 'varchar', length: 12, nullable: true })
  fecha_devolucion?: string;

  @Column({ name: 'Procedencia', type: 'varchar', length: 350, nullable: true })
  procedencia?: string;

  @Column({ name: 'Adscripción', type: 'varchar', length: 350, nullable: true })
  adscripcion?: string;

  @Column({ name: 'UnidadBien', type: 'varchar', length: 350, nullable: true })
  unidad_bien?: string;

  @Column({ name: 'Area', type: 'int', nullable: true })
  area?: number;

  @OneToMany(() => ArticuloSalidaBienAntiguo, (art) => art.salida)
  articulos?: ArticuloSalidaBienAntiguo[];
}
