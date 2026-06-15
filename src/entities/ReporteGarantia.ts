import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Garantia } from './Garantia';
import { Bien } from './Bien';
import { Usuario } from './Usuario';

@Entity('Reportes_Garantia')
export class ReporteGarantia {
  @PrimaryGeneratedColumn({ name: 'id_reporte_garantia' })
  id_reporte_garantia!: number;

  @Column({ name: 'id_garantia', type: 'int' })
  id_garantia!: number;

  @Column({ name: 'id_bien', type: 'uniqueidentifier' })
  id_bien!: string;

  @Column({ name: 'num_serie', type: 'varchar', length: 50, nullable: true })
  num_serie?: string;

  @Column({ name: 'estatus', type: 'varchar', length: 50, default: 'Enviado a proveedor' })
  estatus!: string;

  @Column({ name: 'descripcion_falla', type: 'nvarchar', length: 'MAX' })
  descripcion_falla!: string;

  @Column({ name: 'resolucion', type: 'nvarchar', length: 'MAX', nullable: true })
  resolucion?: string;

  @Column({ name: 'fecha_reporte', type: 'datetime', nullable: true })
  fecha_reporte?: Date;

  @Column({ name: 'fecha_resolucion', type: 'datetime', nullable: true })
  fecha_resolucion?: Date;

  @Column({ name: 'id_usuario_registra', type: 'int', nullable: true })
  id_usuario_registra?: number;

  @ManyToOne(() => Garantia)
  @JoinColumn({ name: 'id_garantia' })
  garantiaObj?: Garantia;

  @ManyToOne(() => Bien)
  @JoinColumn({ name: 'id_bien' })
  bien?: Bien;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_registra' })
  usuarioRegistra?: Usuario;
}
