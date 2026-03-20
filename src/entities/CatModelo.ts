import {
  Entity, PrimaryColumn, Column,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Marca } from './Marca';
import { TipoDispositivo } from './TipoDispositivo';
import { Bien } from './Bien';

@Entity('Cat_Modelos')
export class CatModelo {
  @PrimaryColumn({ name: 'clave_modelo', type: 'varchar', length: 30 })
  clave_modelo!: string;

  @Column({ name: 'clave_marca', type: 'int', nullable: true })
  clave_marca?: number;

  @Column({ name: 'descrip_disp', type: 'varchar', length: 'max', nullable: true })
  descrip_disp?: string;

  @Column({ name: 'tipo_disp', type: 'int', nullable: true })
  tipo_disp?: number;

  @ManyToOne(() => Marca, (marca) => marca.modelos, { nullable: true })
  @JoinColumn({ name: 'clave_marca' })
  marca?: Marca;

  @ManyToOne(() => TipoDispositivo, (td) => td.modelos, { nullable: true })
  @JoinColumn({ name: 'tipo_disp' })
  tipoDispositivo?: TipoDispositivo;

  @OneToMany(() => Bien, (bien) => bien.modelo)
  bienes?: Bien[];
}
