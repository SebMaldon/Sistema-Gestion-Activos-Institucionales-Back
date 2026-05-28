import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Bien } from './Bien';

@Entity('Cuentas_PC')
export class CuentaPC {
  @PrimaryGeneratedColumn({ name: 'id_cuenta' })
  id_cuenta!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  @Column({ name: 'cuenta_windows', type: 'varchar', length: 64, nullable: true })
  cuenta_windows?: string;

  @Column({ name: 'tipo_user', type: 'varchar', length: 50, nullable: true })
  tipo_user?: string;

  @Column({ name: 'correo', type: 'varchar', length: 100, nullable: true })
  correo?: string;

  @ManyToOne(() => Bien, (b) => b.cuentasPC, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;
}
