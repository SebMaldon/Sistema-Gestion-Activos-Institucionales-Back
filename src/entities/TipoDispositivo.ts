import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CatModelo } from './CatModelo';

@Entity('tipo_dispositivos')
export class TipoDispositivo {
  @PrimaryGeneratedColumn({ name: 'tipo_disp' })
  tipo_disp!: number;

  @Column({ name: 'nombre_tipo', type: 'varchar', length: 35, nullable: true })
  nombre_tipo?: string;

  @OneToMany(() => CatModelo, (modelo) => modelo.tipoDispositivo)
  modelos?: CatModelo[];
}
