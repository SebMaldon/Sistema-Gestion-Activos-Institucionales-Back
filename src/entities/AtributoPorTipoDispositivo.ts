import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CatAtributoTecnico } from './CatAtributoTecnico';
import { TipoDispositivo } from './TipoDispositivo';

// Tabla: Atributos_Por_TipoDispositivo
// Sugiere qué atributos son típicos de cada tipo de dispositivo
@Entity('Atributos_Por_TipoDispositivo')
export class AtributoPorTipoDispositivo {
  @PrimaryColumn({ name: 'tipo_disp', type: 'int' })
  tipo_disp!: number;

  @PrimaryColumn({ name: 'id_atributo', type: 'int' })
  id_atributo!: number;

  @Column({ name: 'es_requerido', type: 'bit', default: 0 })
  es_requerido!: boolean;

  @ManyToOne(() => TipoDispositivo)
  @JoinColumn({ name: 'tipo_disp' })
  tipoDispositivo?: TipoDispositivo;

  @ManyToOne(() => CatAtributoTecnico, (a) => a.tiposDispositivo)
  @JoinColumn({ name: 'id_atributo' })
  atributo?: CatAtributoTecnico;
}
