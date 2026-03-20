import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Usuario } from './Usuario';

@Entity('Roles')
export class Rol {
  @PrimaryGeneratedColumn({ name: 'id_rol' })
  id_rol!: number;

  @Column({ name: 'nombre_rol', type: 'varchar', length: 50, unique: true })
  nombre_rol!: string;

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios?: Usuario[];
}
