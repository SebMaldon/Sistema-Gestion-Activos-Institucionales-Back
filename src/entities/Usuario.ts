import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, OneToMany, BeforeInsert, BeforeUpdate,
} from 'typeorm';
import bcrypt from 'bcryptjs';
import { Rol } from './Rol';
import { Bien } from './Bien';
import { Incidencia } from './Incidencia';
import { MovimientoInventario } from './MovimientoInventario';

@Entity('Usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id_usuario!: number;

  @Column({ name: 'matricula', type: 'varchar', length: 20 })
  matricula!: string;

  @Column({ name: 'nombre_completo', type: 'varchar', length: 100 })
  nombre_completo!: string;

  @Column({ name: 'tipo_usuario', type: 'varchar', length: 15, nullable: true })
  tipo_usuario?: string;

  @Column({ name: 'correo_electronico', type: 'varchar', length: 70, nullable: true })
  correo_electronico?: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  password_hash!: string;

  @Column({ name: 'id_rol', type: 'int', default: 3 })
  id_rol!: number;

  @Column({ name: 'estatus', type: 'bit', default: 1 })
  estatus!: boolean;

  @ManyToOne(() => Rol, (rol) => rol.usuarios)
  @JoinColumn({ name: 'id_rol' })
  rol?: Rol;

  @OneToMany(() => Bien, (bien) => bien.usuarioResguardo)
  bienesResguardados?: Bien[];

  @OneToMany(() => Incidencia, (inc) => inc.usuarioReporta)
  incidencias?: Incidencia[];

  @OneToMany(() => MovimientoInventario, (mov) => mov.usuarioAutoriza)
  movimientosAutorizados?: MovimientoInventario[];

  async hashPassword(plainPassword: string): Promise<void> {
    this.password_hash = await bcrypt.hash(plainPassword, 12);
  }

  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password_hash);
  }
}
