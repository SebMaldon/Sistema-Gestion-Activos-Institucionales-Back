import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Bien } from './Bien';
import { UnidadACargo } from './UnidadACargo';
import { Contacto } from './Contacto';
import { Segmento } from './Segmento';

// Tabla: unidades (antes llamada "inmuebles" — datos físicos de la unidad: clave, dirección, etc.)
@Entity('unidades')
export class Inmueble {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  clave!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion?: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  desc_corta?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  encargado?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  direccion?: string;

  @Column({ type: 'varchar', length: 70, nullable: true })
  calle?: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  numero?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  colonia?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ciudad?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  municipio?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cp?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ppal?: string;

  @Column({ name: 'Ubicación_coordenada', type: 'varchar', length: 'max', nullable: true })
  ubicacion_coordenada?: string;

  @Column({ type: 'varchar', length: 5, nullable: false })
  clave_zona!: string;

  @Column({ name: 'clave_A', type: 'int', nullable: true })
  clave_a?: number;

  @Column({ name: 'zonaReporte', type: 'varchar', length: 50, nullable: true })
  zona_reporte?: string;

  @Column({ name: 'Nivel', type: 'int', nullable: true })
  nivel?: number;

  @Column({ name: 'NOInmueble', type: 'int', nullable: true })
  no_inmueble?: number;

  @Column({ name: 'Regimen', type: 'int', nullable: true })
  regimen?: number;

  @Column({ name: 'TipoUnidad', type: 'int', nullable: true })
  tipo_unidad?: number;

  @OneToMany(() => Bien, (bien) => bien.unidad)
  bienes?: Bien[];

  @OneToMany(() => UnidadACargo, uac => uac.inmueble)
  unidadesACargo?: UnidadACargo[];

  @OneToMany(() => Contacto, c => c.inmueble)
  contactos?: Contacto[];

  @OneToMany(() => Segmento, s => s.inmueble)
  segmentos?: Segmento[];
}
