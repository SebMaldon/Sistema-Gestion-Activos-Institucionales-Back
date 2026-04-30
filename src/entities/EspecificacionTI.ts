import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Bien } from './Bien';

@Entity('Especificaciones_TI')
export class EspecificacionTI {
  @PrimaryColumn({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  @Column({ name: 'nom_pc', type: 'varchar', length: 64, nullable: true })
  nom_pc?: string;

  @Column({ name: 'cpu_info', type: 'varchar', length: 100, nullable: true })
  cpu_info?: string;

  @Column({ name: 'ram_gb', type: 'int', nullable: true })
  ram_gb?: number;

  @Column({ name: 'almacenamiento_gb', type: 'int', nullable: true })
  almacenamiento_gb?: number;

  @Column({ name: 'mac_address', type: 'varchar', length: 50, nullable: true })
  mac_address?: string;

  @Column({ name: 'dir_ip', type: 'varchar', length: 15, nullable: true })
  dir_ip?: string;

  @Column({ name: 'dir_mac', type: 'varchar', length: 17, nullable: true })
  dir_mac?: string;

  @Column({ name: 'puerto_red', type: 'varchar', length: 15, nullable: true })
  puerto_red?: string;

  @Column({ name: 'switch_red', type: 'varchar', length: 50, nullable: true })
  switch_red?: string;

  @Column({ name: 'modelo_so', type: 'varchar', length: 50, nullable: true })
  modelo_so?: string;

  @Column({ name: 'id_monitor', type: 'uniqueidentifier', nullable: true })
  id_monitor?: string;

  @OneToOne(() => Bien, (bien) => bien.especificacionTI, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;
}
