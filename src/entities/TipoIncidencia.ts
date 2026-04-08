import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Tipo_Incidencias')
export class TipoIncidencia {
  @PrimaryGeneratedColumn({ name: 'id_tipo_incidencia' })
  id_tipo_incidencia!: number;

  @Column({ name: 'nombre_tipo', type: 'varchar', length: 100, unique: true })
  nombre_tipo!: string;
}
