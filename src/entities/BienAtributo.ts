import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Bien } from './Bien';
import { CatAtributoTecnico } from './CatAtributoTecnico';

// Tabla: Bien_Atributos
// Valores de atributos técnicos por bien (patrón EAV)
@Entity('Bien_Atributos')
export class BienAtributo {
  @PrimaryGeneratedColumn({ name: 'id_bien_atributo' })
  id_bien_atributo!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  @Column({ name: 'id_atributo', type: 'int' })
  id_atributo!: number;

  @Column({ name: 'valor', type: 'nvarchar', length: 500 })
  valor!: string;

  @ManyToOne(() => Bien, (b) => b.atributos)
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;

  @ManyToOne(() => CatAtributoTecnico, (a) => a.bienAtributos)
  @JoinColumn({ name: 'id_atributo' })
  atributo?: CatAtributoTecnico;
}
