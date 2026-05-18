import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BienAtributo } from './BienAtributo';
import { AtributoPorTipoDispositivo } from './AtributoPorTipoDispositivo';

// Tabla: Cat_Atributos_Tecnicos
// Catálogo maestro de atributos técnicos disponibles (RAM, CPU, Pantalla, etc.)
@Entity('Cat_Atributos_Tecnicos')
export class CatAtributoTecnico {
  @PrimaryGeneratedColumn({ name: 'id_atributo' })
  id_atributo!: number;

  @Column({ name: 'nombre_atributo', type: 'varchar', length: 100 })
  nombre_atributo!: string;

  // 'TEXT' | 'NUMERO' | 'BOOLEANO' | 'FECHA'
  @Column({ name: 'tipo_valor', type: 'varchar', length: 20, default: 'TEXT' })
  tipo_valor!: string;

  @Column({ name: 'unidad_medida', type: 'varchar', length: 30, nullable: true })
  unidad_medida?: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 255, nullable: true })
  descripcion?: string;

  @Column({ name: 'activo', type: 'bit', default: 1 })
  activo!: boolean;

  @OneToMany(() => BienAtributo, (ba) => ba.atributo)
  bienAtributos?: BienAtributo[];

  @OneToMany(() => AtributoPorTipoDispositivo, (a) => a.atributo)
  tiposDispositivo?: AtributoPorTipoDispositivo[];
}
