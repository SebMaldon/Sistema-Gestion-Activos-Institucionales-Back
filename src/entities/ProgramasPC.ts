import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Bien } from './Bien';

@Entity('programas_pc')
export class ProgramasPC {
  @PrimaryGeneratedColumn({ name: 'id_programa' })
  id_programa!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  @Column({ name: 'nombre_programa', type: 'varchar', length: 255, nullable: true })
  nombre_programa?: string;

  @Column({ name: 'version', type: 'varchar', length: 100, nullable: true })
  version?: string;

  @Column({ name: 'editor', type: 'varchar', length: 255, nullable: true })
  editor?: string;

  @Column({ name: 'fecha_instalacion', type: 'varchar', length: 100, nullable: true })
  fecha_instalacion?: string;

  @ManyToOne(() => Bien, (b) => b.programasPC, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;
}
