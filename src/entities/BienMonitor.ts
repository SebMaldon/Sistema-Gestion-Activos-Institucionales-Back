import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Bien } from './Bien';

/**
 * Relación muchos-a-muchos entre un equipo (PC/Laptop) y sus monitores asignados.
 * Tabla: Bien_Monitores
 *
 * - id_bien:    FK al bien que ES el equipo (PC o Laptop)
 * - id_monitor: FK al bien que ES el monitor
 * Un monitor se identifica porque su modelo tiene nombre_tipo = 'Monitor'
 */
@Entity('Bien_Monitores')
export class BienMonitor {
  @PrimaryGeneratedColumn({ name: 'id_bien_monitor' })
  id_bien_monitor!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  @Column({ name: 'id_monitor', type: 'uniqueidentifier' })
  id_monitor!: string;

  // El equipo (PC o Laptop) al que pertenece este monitor
  @ManyToOne(() => Bien, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'id_bien' })
  equipo?: Bien;

  // El bien que actúa como monitor
  @ManyToOne(() => Bien, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'id_monitor' })
  monitor?: Bien;
}
