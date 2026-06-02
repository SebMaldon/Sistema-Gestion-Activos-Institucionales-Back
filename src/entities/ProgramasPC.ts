import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Bien } from './Bien';

@Entity('programas_pc')
export class ProgramasPC {
  @PrimaryGeneratedColumn({ name: 'id_programa_pc' })
  id_programa!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  @Column({ name: 'programa', type: 'varchar', length: 100 })
  nombre_programa!: string;

  @Column({ name: 'version_act', type: 'varchar', length: 50, nullable: true })
  version?: string;

  @Column({ name: 'fecha_actualizacion', type: 'date', nullable: true })
  fecha_instalacion?: Date;

  @ManyToOne(() => Bien, (b) => b.programasPC, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;
}
