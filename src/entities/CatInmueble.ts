// NOTA: La tabla Cat_Inmuebles ya no existe en el nuevo modelo de BD.
// Cat_Unidades tampoco se usa activamente.
// Este archivo se mantiene como stub vacío para no romper importaciones durante la migración.
// Se puede eliminar cuando todas las referencias hayan sido limpiadas.

import { Entity, PrimaryColumn, Column } from 'typeorm';

/** @deprecated - Cat_Inmuebles fue eliminada del nuevo modelo de BD */
@Entity('Cat_Unidades')
export class CatInmueble {
  @PrimaryColumn({ name: 'clave_unidad', type: 'varchar', length: 50 })
  clave_inmueble!: string;

  @Column({ name: 'nombre_ubicacion', type: 'varchar', length: 150 })
  nombre_ubicacion!: string;

  @Column({ name: 'direccion', type: 'varchar', length: 'max', nullable: true })
  direccion?: string;

  @Column({ name: 'jefatura_asignada', type: 'varchar', length: 120, nullable: true })
  jefatura_asignada?: string;
}
