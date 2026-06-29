import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/database';
import { Bien } from '../../entities/Bien';
import { EspecificacionTI } from '../../entities/EspecificacionTI';
import { Nota } from '../../entities/Nota';
import { Incidencia } from '../../entities/Incidencia';
import { MovimientoInventario } from '../../entities/MovimientoInventario';
import { BienMonitor } from '../../entities/BienMonitor';
import { BienAtributo } from '../../entities/BienAtributo';
import { CatModelo } from '../../entities/CatModelo';
import { CatCategoriaActivo } from '../../entities/CatCategoriaActivo';
import { CatUnidadMedida } from '../../entities/CatUnidadMedida';
import { Marca } from '../../entities/Marca';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES, applyZonaFilter, isEstandar } from '../../middleware/auth.middleware';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors';
import { PaginationArgs, decodeCursor } from '../../utils/pagination';
import { Segmento } from '../../entities/Segmento';
import { CuentaPC } from '../../entities/CuentaPC';
import { ProgramasPC } from '../../entities/ProgramasPC';
import { Bitacora } from '../../entities/Bitacora';
import { PrestamoBien } from '../../entities/PrestamoBien';
import { EntityManager } from 'typeorm';

// ── Interface: monitor detectado por WMI ──────────────────────────────────────
export interface MonitorWmiInput {
  marca?: string;
  modelo?: string;
  num_serie?: string;
}

export interface MonitorConflicto {
  num_serie: string;
  num_inv_equipo_anterior?: string;
  num_serie_equipo_anterior: string;
}

/**
 * Helper compartido: procesa la lista de monitores WMI para una PC.
 * - Busca/crea el modelo MON-{marca}-{modelo} en Cat_Modelos.
 * - Busca/crea el Bien del monitor (sin num_inv).
 * - Detecta si el monitor estaba vinculado a otra PC → conflicto.
 * - Si forzar=true o sin conflictos: aplica cambios y sincroniza Bien_Monitores.
 * Devuelve { ok, conflictos }.
 */
export async function procesarMonitoresHelper(
  manager: EntityManager,
  id_bien_pc: string,
  monitoresWmi: MonitorWmiInput[],
  forzar: boolean
): Promise<{ ok: boolean; conflictos: MonitorConflicto[] }> {
  const bienRepo = manager.getRepository(Bien);
  const modeloRepo = manager.getRepository(CatModelo);
  const bmRepo = manager.getRepository(BienMonitor);

  // Obtener IDs de catálogo dinámicamente
  // Categoría: busca la que contenga 'computo' o 'cómputo' en el nombre
  const catRepo = manager.getRepository(CatCategoriaActivo);
  const umRepo = manager.getRepository(CatUnidadMedida);

  const catInformatico = await catRepo
    .createQueryBuilder('c')
    .where("LOWER(c.nombre_categoria) LIKE '%informatico%' OR LOWER(c.nombre_categoria) LIKE '%informático%'")
    .getOne();
  const id_categoria = catInformatico?.id_categoria ?? 7;

  const umPza = await umRepo
    .createQueryBuilder('u')
    .where("LOWER(u.abreviatura) = 'pza' OR LOWER(u.nombre_unidad) LIKE '%pieza%'")
    .getOne();
  const id_unidad_medida = umPza?.id_unidad_medida ?? 1;

  // Bien padre (PC)
  const pc = await bienRepo.findOne({ where: { id_bien: id_bien_pc } });
  if (!pc) throw new NotFoundError('PC (bien)');

  // Detectar conflictos: monitores con num_serie vinculados a OTRA PC
  const conflictos: MonitorConflicto[] = [];

  for (const mon of monitoresWmi) {
    if (!mon.num_serie) continue;
    const bienMon = await bienRepo.findOne({ where: { num_serie: mon.num_serie } });
    if (!bienMon) continue; // nuevo, no hay conflicto

    const relExistente = await bmRepo.findOne({ where: { id_monitor: bienMon.id_bien } });
    if (relExistente && relExistente.id_bien !== id_bien_pc) {
      // Está vinculado a otro equipo
      const equipoAnterior = await bienRepo.findOne({ where: { id_bien: relExistente.id_bien } });
      conflictos.push({
        num_serie: mon.num_serie,
        num_inv_equipo_anterior: equipoAnterior?.num_inv ?? undefined,
        num_serie_equipo_anterior: equipoAnterior?.num_serie ?? relExistente.id_bien,
      });
    }
  }

  // Si hay conflictos y no forzar → devolver sin cambios
  if (conflictos.length > 0 && !forzar) {
    return { ok: false, conflictos };
  }

  // Aplicar cambios
  const idsMonitoresNuevos: string[] = [];

  for (const mon of monitoresWmi) {
    if (!mon.num_serie) continue;

    // Buscar o crear la Marca
    const marcaName = (mon.marca || 'GENERICO').trim();
    let marcaEnt = await manager.getRepository(Marca)
      .createQueryBuilder('m')
      .where('LOWER(m.marca) = LOWER(:nombre)', { nombre: marcaName })
      .getOne();
    if (!marcaEnt) {
      marcaEnt = await manager.getRepository(Marca).save({ marca: marcaName });
    }

    // Limpiar marca de la descripción del modelo antes de generar clave_modelo y guardar
    let modeloCleaned = (mon.modelo || '').trim();
    if (marcaName && modeloCleaned.toLowerCase().startsWith(marcaName.toLowerCase())) {
      while (modeloCleaned.toLowerCase().startsWith(marcaName.toLowerCase())) {
        modeloCleaned = modeloCleaned.substring(marcaName.length).trim();
      }
    }

    const marcaClean = marcaName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 15);
    const modeloClean = (modeloCleaned || 'MONITOR').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 20);
    const clave_modelo = `MON-${marcaClean}-${modeloClean}`.substring(0, 30);

    let catModelo = await modeloRepo.findOne({ where: { clave_modelo } });
    if (!catModelo) {
      catModelo = modeloRepo.create({
        clave_modelo,
        descrip_disp: `${marcaName} ${modeloCleaned}`.trim() || 'Monitor',
        clave_marca: marcaEnt.clave_marca,
        // tipo_disp: null (no tiene tipo específico)
      });
      await modeloRepo.save(catModelo);
    } else if (!catModelo.clave_marca) {
      catModelo.clave_marca = marcaEnt.clave_marca;
      await modeloRepo.save(catModelo);
    }

    // 2. Buscar o crear Bien del monitor
    let bienMon = await bienRepo.findOne({ where: { num_serie: mon.num_serie } });
    if (!bienMon) {
      const id_monitor = uuidv4();
      const qr_hash = Buffer.from(`IMSS-${id_monitor}`).toString('base64');
      bienMon = bienRepo.create({
        id_bien: id_monitor,
        qr_hash,
        id_categoria,
        id_unidad_medida,
        num_serie: mon.num_serie,
        // num_inv: dejado vacío (monitor no tiene número de inventario)
        clave_modelo,
        estatus_operativo: 'ACTIVO',
        id_segmento: pc.id_segmento,
        id_ubicacion: pc.id_ubicacion,
        clave_unidad_ref: pc.clave_unidad_ref,
        id_usuario_resguardo: pc.id_usuario_resguardo,
      });
      await bienRepo.save(bienMon);
    } else {
      // Actualizar ubicación/segmento/usuario para que coincida con la PC
      bienMon.id_segmento = pc.id_segmento;
      bienMon.id_ubicacion = pc.id_ubicacion;
      bienMon.clave_unidad_ref = pc.clave_unidad_ref;
      bienMon.id_usuario_resguardo = pc.id_usuario_resguardo;
      bienMon.fecha_actualizacion = new Date();
      bienMon.num_inv = null as any; // Limpiar num_inv si lo tuviera por reglas anteriores
      // Actualizar siempre la clave_modelo con el nuevo MON-{marca}-{modelo}
      bienMon.clave_modelo = clave_modelo;
      await bienRepo.save(bienMon);
    }
    idsMonitoresNuevos.push(bienMon.id_bien.toLowerCase());

    // 3. Desconectar monitor de equipo anterior si existe
    const relVieja = await bmRepo.findOne({ where: { id_monitor: bienMon.id_bien } });
    if (relVieja && relVieja.id_bien !== id_bien_pc) {
      await bmRepo.remove(relVieja);
    }

    // 4. Crear relación Bien_Monitores si no existe
    const relActual = await bmRepo.findOne({ where: { id_bien: id_bien_pc, id_monitor: bienMon.id_bien } });
    if (!relActual) {
      await bmRepo.save(bmRepo.create({ id_bien: id_bien_pc, id_monitor: bienMon.id_bien }));
    }
  }

  // 5. Desvincular monitores viejos que ya no estén conectados físicamente
  const relsActuales = await bmRepo.find({ where: { id_bien: id_bien_pc } });
  for (const rel of relsActuales) {
    if (!idsMonitoresNuevos.includes(rel.id_monitor.toLowerCase())) {
      await bmRepo.remove(rel);
    }
  }

  return { ok: true, conflictos: forzar ? conflictos : [] };
}

export interface BienesFilter {
  estatus_operativo?: string | string[];
  es_capitalizable?: boolean;
  search?: string;
  // Multi-select arrays
  id_categoria?: number[];
  id_segmento?: number[];
  id_ubicacion?: number[];
  id_unidad_medida?: number[];
  id_usuario_resguardo?: number[];
  clave_unidad_ref?: string[];
  clave_modelo?: string[];
  // Device type / brand (via Cat_Modelos)
  tipo_disp?: number[];
  clave_marca?: number[];
  // IT Specs (via Especificaciones_TI)
  ram_min?: number;
  ram_max?: number;
  almacenamiento_min?: number;
  almacenamiento_max?: number;
  modelo_so?: string;
  cpu_info?: string;
  dir_ip?: string;
  // Warranty
  tiene_garantia?: boolean;
  garantia_vigente?: boolean;
  garantia_fin_desde?: string;
  garantia_fin_hasta?: string;
  // Dates
  fecha_adquisicion_desde?: string;
  fecha_adquisicion_hasta?: string;
  fecha_actualizacion_desde?: string;
  fecha_actualizacion_hasta?: string;
  // EAV
  atributo_id?: number;
  atributo_valor?: string;
  // Quick Filters
  con_notas_recientes?: boolean;
  sin_inventario?: boolean;
  inconvenientes?: boolean;
  tiene_agente?: boolean;
  // Sorting
  sort_by?: string;
  sort_dir?: string;
}

export function applyBienesFilters(qb: any, filter?: BienesFilter): { needsTI: boolean } {
  if (filter?.estatus_operativo) {
    if (Array.isArray(filter.estatus_operativo)) {
      if (filter.estatus_operativo.length > 0) {
        qb.andWhere('b.estatus_operativo IN (:...e)', { e: filter.estatus_operativo });
      }
    } else if (filter.estatus_operativo.trim() !== '') {
      qb.andWhere('b.estatus_operativo = :e', { e: filter.estatus_operativo });
    }
  }
  if (filter?.es_capitalizable !== undefined && filter.es_capitalizable !== null) {
    qb.innerJoin('Cat_CategoriasActivo', 'cat_cap', 'cat_cap.id_categoria = b.id_categoria');
    if (filter.es_capitalizable) {
      qb.andWhere('cat_cap.es_capitalizable = 1');
      qb.andWhere('b.num_inv IS NOT NULL AND b.num_inv != \'\'');
      qb.andWhere('UPPER(b.num_inv) NOT LIKE \'%COMODATO%\'');
    } else {
      qb.andWhere('(cat_cap.es_capitalizable = 0 OR b.num_inv IS NULL OR b.num_inv = \'\' OR UPPER(b.num_inv) LIKE \'%COMODATO%\')');
    }
  }
  if (filter?.search) {
    qb.leftJoin('Especificaciones_TI', 'ti_search', 'ti_search.id_bien = b.id_bien');
    qb.leftJoin('Cat_Modelos', 'mod_search', 'mod_search.clave_modelo = b.clave_modelo');

    const term = filter.search.trim();
    const isIP = /^[0-9]{1,3}(\.[0-9]{1,3}){1,3}/.test(term);

    if (isIP) {
      qb.andWhere(
        '(LTRIM(RTRIM(b.num_serie)) LIKE :s OR b.num_inv LIKE :s OR b.clave_presupuestal LIKE :s OR b.clave_modelo LIKE :s OR TRY_CAST(b.id_bien AS NVARCHAR(36)) LIKE :s ' +
        'OR mod_search.descrip_disp LIKE :s OR ti_search.nombre_host LIKE :s ' +
        'OR ti_search.dir_ip = :exact ' +
        'OR ti_search.dir_ip LIKE :start ' +
        'OR ti_search.dir_ip LIKE :end ' +
        'OR ti_search.dir_ip LIKE :mid ' +
        'OR EXISTS (SELECT 1 FROM Cuentas_PC cpc WHERE cpc.id_bien = b.id_bien AND (cpc.cuenta_windows LIKE :s OR cpc.correo LIKE :s)))',
        {
          s: `%${term}%`,
          exact: term,
          start: `${term}/%`,
          end: `%/${term}`,
          mid: `%/${term}/%`
        }
      );
    } else {
      qb.andWhere(
        '(LTRIM(RTRIM(b.num_serie)) LIKE :s OR b.num_inv LIKE :s OR b.clave_presupuestal LIKE :s OR b.clave_modelo LIKE :s OR TRY_CAST(b.id_bien AS NVARCHAR(36)) LIKE :s OR ti_search.dir_ip LIKE :s ' +
        'OR mod_search.descrip_disp LIKE :s OR ti_search.nombre_host LIKE :s ' +
        'OR EXISTS (SELECT 1 FROM Cuentas_PC cpc WHERE cpc.id_bien = b.id_bien AND (cpc.cuenta_windows LIKE :s OR cpc.correo LIKE :s)))',
        { s: `%${term}%` }
      );
    }
  }

  if (filter?.id_categoria?.length) qb.andWhere('b.id_categoria IN (:...ic)', { ic: filter.id_categoria });
  if (filter?.id_segmento?.length) qb.andWhere('b.id_segmento IN (:...iseg)', { iseg: filter.id_segmento });
  if (filter?.id_ubicacion?.length) qb.andWhere('b.id_ubicacion IN (:...iub)', { iub: filter.id_ubicacion });
  if (filter?.id_unidad_medida?.length) qb.andWhere('b.id_unidad_medida IN (:...ium)', { ium: filter.id_unidad_medida });
  if (filter?.id_usuario_resguardo?.length) qb.andWhere('b.id_usuario_resguardo IN (:...ur)', { ur: filter.id_usuario_resguardo });
  if (filter?.clave_unidad_ref?.length) qb.andWhere('b.clave_unidad_ref IN (:...cur)', { cur: filter.clave_unidad_ref });
  if (filter?.clave_modelo?.length) qb.andWhere('b.clave_modelo IN (:...cm)', { cm: filter.clave_modelo });

  if (filter?.tipo_disp?.length || filter?.clave_marca?.length) {
    qb.innerJoin('Cat_Modelos', 'mod', 'mod.clave_modelo = b.clave_modelo');
    if (filter.tipo_disp?.length) qb.andWhere('mod.tipo_disp IN (:...td)', { td: filter.tipo_disp });
    if (filter.clave_marca?.length) qb.andWhere('mod.clave_marca IN (:...mk)', { mk: filter.clave_marca });
  }

  const needsTI = (
    filter?.ram_min != null || filter?.ram_max != null ||
    filter?.almacenamiento_min != null || filter?.almacenamiento_max != null ||
    filter?.modelo_so || filter?.cpu_info || filter?.dir_ip
  );
  if (needsTI) {
    qb.innerJoin('Especificaciones_TI', 'ti', 'ti.id_bien = b.id_bien');
    if (filter!.ram_min != null) qb.andWhere('ti.ram_gb >= :rmin', { rmin: filter!.ram_min });
    if (filter!.ram_max != null) qb.andWhere('ti.ram_gb <= :rmax', { rmax: filter!.ram_max });
    if (filter!.almacenamiento_min != null) qb.andWhere('ti.almacenamiento_gb >= :amin', { amin: filter!.almacenamiento_min });
    if (filter!.almacenamiento_max != null) qb.andWhere('ti.almacenamiento_gb <= :amax', { amax: filter!.almacenamiento_max });
    if (filter!.modelo_so) qb.andWhere('ti.modelo_so LIKE :so', { so: `%${filter!.modelo_so}%` });
    if (filter!.cpu_info) qb.andWhere('ti.cpu_info LIKE :cpu', { cpu: `%${filter!.cpu_info}%` });
    if (filter!.dir_ip) qb.andWhere('ti.dir_ip LIKE :ip', { ip: `%${filter!.dir_ip}%` });
  }

  if (filter?.tiene_garantia === false) {
    qb.leftJoin('Garantias', 'gf', 'gf.id_bien = b.id_bien');
    qb.andWhere('gf.id_garantia IS NULL');
  } else if (
    filter?.tiene_garantia === true ||
    filter?.garantia_vigente != null ||
    filter?.garantia_fin_desde || filter?.garantia_fin_hasta
  ) {
    qb.innerJoin('Garantias', 'gf', 'gf.id_bien = b.id_bien');
    if (filter.garantia_vigente === true) qb.andWhere("gf.estado_garantia = 'VIGENTE'");
    if (filter.garantia_fin_desde) qb.andWhere('gf.fecha_fin >= :gfd', { gfd: filter.garantia_fin_desde });
  }

  if (filter?.tiene_agente !== undefined && filter?.tiene_agente !== null) {
    if (filter.tiene_agente) {
      qb.andWhere("b.id_bien IN (SELECT id_bien FROM Programas_PC WHERE programa LIKE 'Gestor Activos HW%')");
    } else {
      qb.andWhere("b.id_bien NOT IN (SELECT id_bien FROM Programas_PC WHERE programa LIKE 'Gestor Activos HW%')");
    }
  }

  if (filter?.con_notas_recientes) {
    qb.innerJoin('Notas', 'n', 'n.id_bien = b.id_bien');
    qb.andWhere('n.fecha_creacion >= DATEADD(day, -30, GETDATE())');
  }

  if (filter?.sin_inventario) {
    qb.andWhere('(b.num_inv IS NULL OR b.num_inv = \'\' OR b.num_inv = \'N/D\')');
    qb.leftJoin('Cat_Modelos', 'mod_si', 'mod_si.clave_modelo = b.clave_modelo');
    qb.andWhere('mod_si.tipo_disp IN (3, 4)');
  }

  if (filter?.inconvenientes) {
    qb.leftJoin('Cat_Modelos', 'mod_inc', 'mod_inc.clave_modelo = b.clave_modelo');
    qb.leftJoin('Especificaciones_TI', 'ti_inc', 'ti_inc.id_bien = b.id_bien');
    qb.andWhere(`(
      (mod_inc.tipo_disp IN (3, 4) AND (b.num_inv IS NULL OR b.num_inv = '' OR b.num_inv = 'N/D'))
      OR
      (ti_inc.dir_ip IS NOT NULL AND ti_inc.dir_ip != '' AND ti_inc.dir_ip IN (
        SELECT dir_ip FROM Especificaciones_TI
        WHERE dir_ip IS NOT NULL AND dir_ip != ''
        GROUP BY dir_ip HAVING COUNT(*) > 1
      ))
      OR
      EXISTS (
        SELECT 1 FROM Prestamos_Bienes pb_inc
        WHERE pb_inc.id_bien = b.id_bien
          AND pb_inc.fecha_entrega IS NULL
          AND pb_inc.fecha_a_terminar_prestamo IS NOT NULL
          AND pb_inc.fecha_a_terminar_prestamo < GETDATE()
      )
    )`);
  }

  if (filter?.atributo_id != null && filter?.atributo_valor) {
    qb.innerJoin('Bien_Atributos', 'ba', 'ba.id_bien = b.id_bien');
    qb.andWhere('ba.id_atributo = :aid', { aid: filter.atributo_id });
    qb.andWhere('ba.valor LIKE :aval', { aval: `%${filter.atributo_valor}%` });
  }

  if (filter?.fecha_adquisicion_desde) {
    qb.andWhere('b.fecha_adquisicion >= :fad', { fad: filter.fecha_adquisicion_desde });
  }
  if (filter?.fecha_adquisicion_hasta) {
    qb.andWhere('b.fecha_adquisicion <= :fah', { fah: filter.fecha_adquisicion_hasta });
  }
  if (filter?.fecha_actualizacion_desde) {
    qb.andWhere('b.fecha_actualizacion >= :facd', { facd: filter.fecha_actualizacion_desde });
  }
  if (filter?.fecha_actualizacion_hasta) {
    qb.andWhere('b.fecha_actualizacion <= :fach', { fach: filter.fecha_actualizacion_hasta });
  }
  return { needsTI: !!needsTI };
}

export const bienesResolvers = {
  Query: {
    reportePorUnidades: async (
      _: unknown,
      { filter }: { filter?: BienesFilter },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const { Garantia } = await import('../../entities/Garantia');
      const qb = AppDataSource.getRepository(Bien).createQueryBuilder('b');
      applyZonaFilter(qb, 'b', context);
      applyBienesFilters(qb, filter);

      qb.leftJoin('unidades', 'rep_u', 'rep_u.clave = b.clave_unidad_ref')
        .leftJoin('Ubicaciones', 'rep_ub', 'rep_ub.id_ubicacion = b.id_ubicacion')
        .leftJoin('Cat_Modelos', 'rep_cm', 'rep_cm.clave_modelo = b.clave_modelo')
        .leftJoin('tipo_dispositivos', 'rep_td', 'rep_td.tipo_disp = rep_cm.tipo_disp')
        .leftJoin('Especificaciones_TI', 'rep_ti', 'rep_ti.id_bien = b.id_bien')
        .select([
          'b.id_bien AS id_bien',
          'b.estatus_operativo AS estatus_operativo',
          'b.num_inv AS num_inv',
          'b.clave_unidad_ref AS clave_unidad_ref',
          'rep_u.clave AS u_clave',
          'rep_u.desc_corta AS u_desc_corta',
          'rep_u.descripcion AS u_descripcion',
          'rep_ub.nombre_ubicacion AS nombre_ubicacion',
          'rep_td.nombre_tipo AS nombre_tipo',
          'rep_cm.tipo_disp AS tipo_disp',
          'rep_ti.dir_ip AS dir_ip'
        ]);

      const [rows, garantiasRaw, notasRaw, dupIpsRaw, overdueRaw] = await Promise.all([
        qb.getRawMany(),
        AppDataSource.getRepository(Garantia)
          .createQueryBuilder('g')
          .select(['g.id_bien AS id_bien', 'g.fecha_fin AS fecha_fin'])
          .getRawMany(),
        AppDataSource.getRepository(Nota)
          .createQueryBuilder('n')
          .select('n.id_bien AS id_bien')
          .where('n.fecha_creacion >= DATEADD(day, -30, GETDATE())')
          .getRawMany(),
        AppDataSource.getRepository(EspecificacionTI)
          .createQueryBuilder('t')
          .select('t.dir_ip AS dir_ip')
          .where("t.dir_ip IS NOT NULL AND t.dir_ip != ''")
          .groupBy('t.dir_ip')
          .having('COUNT(*) > 1')
          .getRawMany(),
        AppDataSource.getRepository(PrestamoBien)
          .createQueryBuilder('pb')
          .select('pb.id_bien AS id_bien')
          .where('pb.fecha_entrega IS NULL')
          .andWhere('pb.fecha_a_terminar_prestamo IS NOT NULL')
          .andWhere('pb.fecha_a_terminar_prestamo < GETDATE()')
          .getRawMany()
      ]);

      const garantiasMap = new Map<string, Date[]>();
      garantiasRaw.forEach((g: any) => {
        const id = (g.id_bien || '').toLowerCase();
        if (!garantiasMap.has(id)) garantiasMap.set(id, []);
        if (g.fecha_fin) garantiasMap.get(id)!.push(new Date(g.fecha_fin));
      });

      const notasRecientesSet = new Set(notasRaw.map((n: any) => (n.id_bien || '').toLowerCase()));
      const dupIpsSet = new Set(dupIpsRaw.map((t: any) => (t.dir_ip || '').trim()));
      const overdueSet = new Set(overdueRaw.map((p: any) => (p.id_bien || '').toLowerCase()));

      const map = new Map<string, any>();
      const now = new Date();

      const isNotBien = (tipo?: string) => {
        if (!tipo) return false;
        const t = tipo.toLowerCase();
        return t.includes('monitor') || t.includes('mouse') || t.includes('ratón') || t.includes('raton') || t.includes('teclado');
      };

      const categorizeDevice = (tipo?: string) => {
        const t = (tipo || '').toLowerCase();
        if (t.includes('pc') || t.includes('escritorio') || t.includes('desktop') || t.includes('cómputo') || t.includes('computo')) return 'pcs';
        if (t.includes('laptop') || t.includes('notebook') || t.includes('portátil') || t.includes('portatil')) return 'laptops';
        if (t.includes('impresora') || t.includes('multifuncional')) return 'impresoras';
        if (t.includes('switch')) return 'switches';
        if (t.includes('teléfono') || t.includes('telefono')) {
          if (t.includes('ip')) return 'telefonosIP';
          return 'telefonosNormal';
        }
        return 'otros';
      };

      rows.forEach((r: any) => {
        if (isNotBien(r.nombre_tipo)) return;

        const clave = r.u_clave || r.clave_unidad_ref || 'SIN_UNIDAD';
        const descCorta = r.u_desc_corta || 'Sin Unidad Asignada';
        const descripcion = r.u_descripcion || 'Sin Unidad Asignada';

        if (!map.has(clave)) {
          map.set(clave, {
            clave,
            descCorta,
            descripcion,
            total: 0,
            inconvenientes: 0,
            pcs: 0, laptops: 0, impresoras: 0, switches: 0, telefonosIP: 0, telefonosNormal: 0, otros: 0,
            ubicacionesStats: {},
            detailStats: {
              total: 0,
              byEstatus: {},
              byTipoDetalle: {},
              garantiaVigente: 0,
              garantiaVencida: 0,
              sinGarantia: 0,
              conAdv: 0
            }
          });
        }

        const g = map.get(clave)!;
        g.total++;

        const isPcOrLaptop = r.tipo_disp === 3 || r.tipo_disp === 4;
        const noInv = !r.num_inv || r.num_inv === '' || r.num_inv === 'N/D';
        const hasCondA = isPcOrLaptop && noInv;
        const hasCondB = r.dir_ip && typeof r.dir_ip === 'string' && dupIpsSet.has(r.dir_ip.trim());
        const hasCondC = overdueSet.has((r.id_bien || '').toLowerCase());
        if (hasCondA || hasCondB || hasCondC) {
          g.inconvenientes++;
        }

        const cat = categorizeDevice(r.nombre_tipo);
        g[cat]++;

        const ubicacionNombre = r.nombre_ubicacion || 'Sin Ubicación';
        if (!g.ubicacionesStats[ubicacionNombre]) {
          g.ubicacionesStats[ubicacionNombre] = { total: 0, tipos: {} };
        }
        g.ubicacionesStats[ubicacionNombre].total++;

        let uTipo = r.nombre_tipo || 'Desconocido';
        const uTipoLower = uTipo.toLowerCase();
        if (uTipoLower.includes('teléfono') || uTipoLower.includes('telefono')) {
          uTipo = uTipoLower.includes('ip') ? 'Teléfono IP' : 'Teléfono Analógico/Otros';
        }
        g.ubicacionesStats[ubicacionNombre].tipos[uTipo] = (g.ubicacionesStats[ubicacionNombre].tipos[uTipo] || 0) + 1;

        const ds = g.detailStats;
        ds.total++;

        const st = r.estatus_operativo || 'DESCONOCIDO';
        ds.byEstatus[st] = (ds.byEstatus[st] || 0) + 1;

        if (!ds.byTipoDetalle[uTipo]) {
          ds.byTipoDetalle[uTipo] = { total: 0, estatus: {} };
        }
        ds.byTipoDetalle[uTipo].total++;
        ds.byTipoDetalle[uTipo].estatus[st] = (ds.byTipoDetalle[uTipo].estatus[st] || 0) + 1;

        const idLower = (r.id_bien || '').toLowerCase();
        const gDates = garantiasMap.get(idLower);
        if (gDates && gDates.length > 0) {
          if (gDates.some(d => d > now)) {
            ds.garantiaVigente++;
          } else {
            ds.garantiaVencida++;
          }
        } else {
          ds.sinGarantia++;
        }

        if (notasRecientesSet.has(idLower)) {
          ds.conAdv++;
        }
      });

      const arr = Array.from(map.values()).map(g => ({
        clave: g.clave,
        descCorta: g.descCorta,
        descripcion: g.descripcion,
        pcs: g.pcs,
        laptops: g.laptops,
        impresoras: g.impresoras,
        switches: g.switches,
        telefonosIP: g.telefonosIP,
        telefonosNormal: g.telefonosNormal,
        otros: g.otros,
        total: g.total,
        inconvenientes: g.inconvenientes,
        ubicacionesStatsJson: JSON.stringify(g.ubicacionesStats),
        detailStatsJson: JSON.stringify(g.detailStats)
      }));

      arr.sort((a, b) => b.total - a.total);
      return arr;
    },

    bienes: async (
      _: unknown,
      { filter, pagination }: { filter?: BienesFilter; pagination?: PaginationArgs },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const qb = AppDataSource.getRepository(Bien).createQueryBuilder('b');

      // ── Filtro por zona (usuarios estándar rol=3 ven solo su zona) ────────
      applyZonaFilter(qb, 'b', context);
      const { needsTI } = applyBienesFilters(qb, filter);

      // ── Count + Pagination ───────────────────────────────────
      const totalCount = await qb.getCount();
      const first = Math.min(pagination?.first ?? 20, 20000);

      let skip = 0;
      if (pagination?.page && pagination.page > 0) {
        skip = (pagination.page - 1) * first;
      } else if (pagination?.after) {
        skip = parseInt(decodeCursor(pagination.after), 10);
        if (isNaN(skip)) skip = 0;
      }

      qb.skip(skip);
      qb.take(first);

      let sortDir: 'ASC' | 'DESC' = (filter?.sort_dir?.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

      if (filter?.sort_by === 'id_serie') {
        qb.addSelect('COALESCE(b.num_inv, b.num_serie)', 'sort_id_serie');
        qb.orderBy('sort_id_serie', sortDir);
      } else if (filter?.sort_by === 'host') {
        qb.leftJoin('Especificaciones_TI', 'ti_sort', 'ti_sort.id_bien = b.id_bien');
        qb.addSelect('ti_sort.nombre_host');
        qb.orderBy('ti_sort.nombre_host', sortDir);
      } else if (filter?.sort_by === 'unidad') {
        qb.leftJoin('unidades', 'uni_sort', 'uni_sort.clave = b.clave_unidad_ref');
        qb.addSelect('uni_sort.descripcion');
        qb.orderBy('uni_sort.descripcion', sortDir);
      } else if (filter?.sort_by === 'resguardo') {
        qb.leftJoin('Usuarios', 'usr_sort', 'usr_sort.id_usuario = b.id_usuario_resguardo');
        qb.addSelect('usr_sort.nombre_completo');
        qb.orderBy('usr_sort.nombre_completo', sortDir);
      } else if (filter?.sort_by === 'estatus') {
        qb.orderBy('b.estatus_operativo', sortDir);
      } else if (filter?.sort_by === 'ip') {
        const getIpExpr = (alias: string) => `(CASE WHEN CHARINDEX('/', ${alias}.dir_ip) > 0 THEN LTRIM(RTRIM(LEFT(${alias}.dir_ip, CHARINDEX('/', ${alias}.dir_ip) - 1))) ELSE LTRIM(RTRIM(${alias}.dir_ip)) END)`;

        if (!needsTI) {
          qb.leftJoin('Especificaciones_TI', 'ti_sort', 'ti_sort.id_bien = b.id_bien');
          const ipExpr = getIpExpr('ti_sort');
          qb.addSelect(`TRY_CAST(PARSENAME(${ipExpr}, 4) AS INT)`, 'ip_1');
          qb.addSelect(`TRY_CAST(PARSENAME(${ipExpr}, 3) AS INT)`, 'ip_2');
          qb.addSelect(`TRY_CAST(PARSENAME(${ipExpr}, 2) AS INT)`, 'ip_3');
          qb.addSelect(`TRY_CAST(PARSENAME(${ipExpr}, 1) AS INT)`, 'ip_4');
          qb.orderBy('ip_1', sortDir).addOrderBy('ip_2', sortDir).addOrderBy('ip_3', sortDir).addOrderBy('ip_4', sortDir);
        } else {
          const ipExpr = getIpExpr('ti');
          qb.addSelect(`TRY_CAST(PARSENAME(${ipExpr}, 4) AS INT)`, 'ip_1');
          qb.addSelect(`TRY_CAST(PARSENAME(${ipExpr}, 3) AS INT)`, 'ip_2');
          qb.addSelect(`TRY_CAST(PARSENAME(${ipExpr}, 2) AS INT)`, 'ip_3');
          qb.addSelect(`TRY_CAST(PARSENAME(${ipExpr}, 1) AS INT)`, 'ip_4');
          qb.orderBy('ip_1', sortDir).addOrderBy('ip_2', sortDir).addOrderBy('ip_3', sortDir).addOrderBy('ip_4', sortDir);
        }
      } else if (filter?.sort_by === 'fecha_actualizacion') {
        qb.orderBy('b.fecha_actualizacion', sortDir);
      } else if (filter?.sort_by === 'fecha_adquisicion') {
        qb.orderBy('b.fecha_adquisicion', sortDir);
      } else {
        qb.orderBy('b.fecha_actualizacion', 'DESC');
      }

      const items = await qb.getMany();

      const edges = items.map((node, index) => ({
        node,
        cursor: Buffer.from(String(skip + index + 1)).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: items.length === first,
          hasPreviousPage: skip > 0,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
          totalCount,
        },
      };
    },

    bien: async (_: unknown, { id_bien }: { id_bien: string }, context: GraphQLContext) => {
      requireAuth(context);
      const b = await AppDataSource.getRepository(Bien).findOne({ where: { id_bien } });
      if (!b) throw new NotFoundError('Bien');
      // Verificar acceso por zona si es usuario estándar
      if (isEstandar(context) && !['U003', 'T003'].includes(b.num_serie || '')) {
        if (context.user?.clave_zona) {
          if (b.clave_unidad_ref) {
            const uni = await AppDataSource.query(
              `SELECT 1 AS ok FROM unidades WHERE clave = @0 AND clave_zona = @1`,
              [b.clave_unidad_ref, context.user.clave_zona]
            );
            if (!uni?.length) throw new ForbiddenError('No tienes acceso a este activo.');
          } else {
            throw new ForbiddenError('No tienes acceso a este activo.');
          }
        } else {
          throw new ForbiddenError('No tienes acceso a este activo.');
        }
      }
      return b;
    },

    bienByQR: async (_: unknown, { qr_hash }: { qr_hash: string }, context: GraphQLContext) => {
      requireAuth(context);
      const b = await AppDataSource.getRepository(Bien).findOne({ where: { qr_hash } });
      if (b && isEstandar(context) && !['U003', 'T003'].includes(b.num_serie || '')) {
        if (context.user?.clave_zona) {
          if (b.clave_unidad_ref) {
            const uni = await AppDataSource.query(
              `SELECT 1 AS ok FROM unidades WHERE clave = @0 AND clave_zona = @1`,
              [b.clave_unidad_ref, context.user.clave_zona]
            );
            if (!uni?.length) return null;
          } else {
            return null;
          }
        } else {
          return null;
        }
      }
      return b;
    },

    bienByNumSerie: async (_: unknown, { num_serie }: { num_serie: string }, context: GraphQLContext) => {
      requireAuth(context);
      const b = await AppDataSource.getRepository(Bien).findOne({ where: { num_serie } });
      if (b && isEstandar(context) && !['U003', 'T003'].includes(b.num_serie || '')) {
        if (context.user?.clave_zona) {
          if (b.clave_unidad_ref) {
            const uni = await AppDataSource.query(
              `SELECT 1 AS ok FROM unidades WHERE clave = @0 AND clave_zona = @1`,
              [b.clave_unidad_ref, context.user.clave_zona]
            );
            if (!uni?.length) return null;
          } else {
            return null;
          }
        } else {
          return null;
        }
      }
      return b;
    },

    bienByNumInv: async (_: unknown, { num_inv }: { num_inv: string }, context: GraphQLContext) => {
      requireAuth(context);
      const b = await AppDataSource.getRepository(Bien).findOne({ where: { num_inv } });
      if (b && isEstandar(context) && !['U003', 'T003'].includes(b.num_serie || '')) {
        if (context.user?.clave_zona) {
          if (b.clave_unidad_ref) {
            const uni = await AppDataSource.query(
              `SELECT 1 AS ok FROM unidades WHERE clave = @0 AND clave_zona = @1`,
              [b.clave_unidad_ref, context.user.clave_zona]
            );
            if (!uni?.length) return null;
          } else {
            return null;
          }
        } else {
          return null;
        }
      }
      return b;
    },

    bienByTermino: async (_: unknown, { termino }: { termino: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Bien)
        .createQueryBuilder('b')
        .leftJoinAndSelect('b.especificacionTI', 'e')
        .where('(TRY_CONVERT(uniqueidentifier, :termino) IS NOT NULL AND b.id_bien = TRY_CONVERT(uniqueidentifier, :termino))', { termino })
        .orWhere('b.qr_hash = :termino', { termino })
        .orWhere('b.num_serie = :termino', { termino })
        .orWhere('b.num_inv = :termino', { termino })
        .orWhere('(e.dir_ip = :termino OR e.dir_ip LIKE :termino_start OR e.dir_ip LIKE :termino_end OR e.dir_ip LIKE :termino_mid)', {
          termino: termino,
          termino_start: termino + '/%',
          termino_end: '%/' + termino,
          termino_mid: '%/' + termino + '/%'
        })
        .getMany();
    },

    checkBienesExistBySerie: async (_: unknown, { series }: { series: string[] }, context: GraphQLContext) => {
      requireAuth(context);
      if (!series || series.length === 0) return [];
      const bienes = await AppDataSource.getRepository(Bien)
        .createQueryBuilder('b')
        .select('b.num_serie')
        .where('b.num_serie IN (:...series)', { series })
        .getMany();
      return bienes.map(b => b.num_serie);
    },

    checkDuplicateIP: async (_: unknown, { dir_ip, id_bien_exclude }: { dir_ip: string; id_bien_exclude?: string }, context: GraphQLContext) => {
      requireAuth(context);
      if (!dir_ip || dir_ip.trim() === '') return [];
      const qb = AppDataSource.getRepository(Bien)
        .createQueryBuilder('b')
        .innerJoin('Especificaciones_TI', 'e', 'e.id_bien = b.id_bien')
        .leftJoinAndSelect('b.modelo', 'm')
        .where('(e.dir_ip = :dir_ip OR e.dir_ip LIKE :start OR e.dir_ip LIKE :end OR e.dir_ip LIKE :mid)', {
          dir_ip: dir_ip.trim(),
          start: `${dir_ip.trim()}/%`,
          end: `%/${dir_ip.trim()}`,
          mid: `%/${dir_ip.trim()}/%`
        });
      if (id_bien_exclude) {
        qb.andWhere('b.id_bien != :id_bien_exclude', { id_bien_exclude });
      }
      return qb.getMany();
    },

    // ── Forzar Sincronización
    checkSyncPending: async (_: unknown, { num_serie }: { num_serie: string }, context: GraphQLContext) => {
      // Permitimos a ti_autosync (o sin auth total si fuera necesario, pero la WinApp envía token)
      requireAuth(context);
      const bien = await AppDataSource.getRepository(Bien).findOne({ where: { num_serie } });
      if (!bien) return false;
      return !!bien.forzar_sync;
    },

    // Lista todos los bienes cuyo modelo tiene nombre_tipo LIKE '%Monitor%'
    bienesMonitor: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Bien)
        .createQueryBuilder('b')
        .innerJoin('b.modelo', 'm')
        .innerJoin('m.tipoDispositivo', 't')
        .where("LOWER(t.nombre_tipo) LIKE '%monitor%'")
        .orderBy('b.fecha_actualizacion', 'DESC')
        .getMany();
    },

    // Monitores asignados a un equipo específico
    monitoresDeEquipo: async (
      _: unknown,
      { id_bien }: { id_bien: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      return AppDataSource.getRepository(BienMonitor).find({ where: { id_bien } });
    },

    // ── Cuentas PC ────────────────────────────────────────────────────────
    cuentasPC: async (_: unknown, { id_bien }: { id_bien: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(CuentaPC).find({ where: { id_bien }, order: { id_cuenta: 'ASC' } });
    },

    cuentaPC: async (_: unknown, { id_cuenta }: { id_cuenta: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(CuentaPC).findOne({ where: { id_cuenta: parseInt(id_cuenta) } });
    },

    // ── Programas PC ────────────────────────────────────────────────────────
    programasPC: async (_: unknown, { id_bien }: { id_bien: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(ProgramasPC).find({ where: { id_bien }, order: { programa: 'ASC' } });
    },
  },

  Mutation: {
    // ── Forzar Sincronización
    setSyncPending: async (_: unknown, { id_bien }: { id_bien: string }, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Bien);
      const bien = await repo.findOne({ where: { id_bien } });
      if (!bien) throw new NotFoundError('Bien');
      bien.forzar_sync = true;
      await repo.save(bien);
      return true;
    },

    setSyncPendingAll: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      await AppDataSource.getRepository(Bien)
        .createQueryBuilder()
        .update(Bien)
        .set({ forzar_sync: true })
        .where("id_bien IN (SELECT id_bien FROM Programas_PC WHERE programa LIKE 'Gestor Activos HW%')")
        .execute();
      return true;
    },

    clearSyncPending: async (_: unknown, { num_serie }: { num_serie: string }, context: GraphQLContext) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(Bien);
      const bien = await repo.findOne({ where: { num_serie } });
      if (!bien) return false;
      bien.forzar_sync = false;
      await repo.save(bien);
      return true;
    },

    clearIpFromOtherBienes: async (_: unknown, { dir_ip, id_bien_exclude }: { dir_ip: string; id_bien_exclude?: string }, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      if (!dir_ip || dir_ip.trim() === '') return false;
      const cleanIp = dir_ip.trim();
      const qb = AppDataSource.getRepository(EspecificacionTI)
        .createQueryBuilder()
        .update(EspecificacionTI)
        .set({
          dir_ip: () => `REPLACE(REPLACE(REPLACE(dir_ip, '/${cleanIp}', ''), '${cleanIp}/', ''), '${cleanIp}', '')`
        })
        .where('(dir_ip = :cleanIp OR dir_ip LIKE :start OR dir_ip LIKE :end OR dir_ip LIKE :mid)', {
          cleanIp,
          start: `${cleanIp}/%`,
          end: `%/${cleanIp}`,
          mid: `%/${cleanIp}/%`
        });
      if (id_bien_exclude) {
        qb.andWhere('id_bien != :id_bien_exclude', { id_bien_exclude });
      }
      await qb.execute();
      return true;
    },

    createBien: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      if (!args.id_categoria) throw new ValidationError('Debe seleccionar la categoría del bien.');
      if (!args.id_unidad_medida) throw new ValidationError('Debe especificar la unidad de medida.');
      if (!args.estatus_operativo || args.estatus_operativo.trim() === '') {
        throw new ValidationError('El estatus operativo es obligatorio.');
      }

      const repo = AppDataSource.getRepository(Bien);

      if (args.num_serie && args.num_serie.trim() !== '') {
        const dupSerie = await repo.findOne({ where: { num_serie: args.num_serie.trim() } });
        if (dupSerie) {
          throw new ValidationError(`El número de serie "${args.num_serie.trim()}" ya está registrado en otro bien.`);
        }
      }



      const id_bien = uuidv4();
      const qr_hash = Buffer.from(`IMSS-${id_bien}`).toString('base64');
      const bien = repo.create({ ...args, id_bien, qr_hash });
      return repo.save(bien);
    },

    createBienesBulk: async (_: unknown, { bienes }: { bienes: any[] }, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const repoBien = queryRunner.manager.getRepository(Bien);
        const repoEspecTI = queryRunner.manager.getRepository(EspecificacionTI);
        const repoAttr = queryRunner.manager.getRepository(BienAtributo);
        const repoMonitor = queryRunner.manager.getRepository(BienMonitor);

        for (let i = 0; i < bienes.length; i++) {
          const b = bienes[i];
          const rowNum = i + 1;

          if (!b.id_categoria) throw new ValidationError(`Fila ${rowNum}: Debe seleccionar la categoría del bien.`);
          if (!b.id_unidad_medida) throw new ValidationError(`Fila ${rowNum}: Debe especificar la unidad de medida.`);
          if (!b.estatus_operativo || b.estatus_operativo.trim() === '') {
            throw new ValidationError(`Fila ${rowNum}: El estatus operativo es obligatorio.`);
          }

          if (b.num_serie && b.num_serie.trim() !== '') {
            let existingBien = await repoBien.findOne({ where: { num_serie: b.num_serie.trim() } });

            if (existingBien) {
              const { especificacionTI, atributos, id_monitor, serie_monitor_asignado, ...bienData } = b;



              Object.keys(bienData).forEach(key => {
                if (bienData[key] === null || bienData[key] === undefined || bienData[key] === '') {
                  delete bienData[key];
                }
              });

              bienData.fecha_actualizacion = new Date();
              repoBien.merge(existingBien, bienData);
              await repoBien.save(existingBien);

              if (especificacionTI) {
                Object.keys(especificacionTI).forEach(k => {
                  if (especificacionTI[k] === null || especificacionTI[k] === undefined || especificacionTI[k] === '') {
                    delete especificacionTI[k];
                  }
                });
                if (Object.keys(especificacionTI).length > 0) {
                  let existingSpecs = await repoEspecTI.findOne({ where: { id_bien: existingBien.id_bien } });
                  if (existingSpecs) {
                    repoEspecTI.merge(existingSpecs, especificacionTI);
                    await repoEspecTI.save(existingSpecs);
                  } else {
                    const newSpecs = repoEspecTI.create({ id_bien: existingBien.id_bien, ...especificacionTI });
                    await repoEspecTI.save(newSpecs);
                  }
                }
              }
              continue;
            }
          }



          const id_bien = uuidv4();
          const qr_hash = Buffer.from(`IMSS-${id_bien}`).toString('base64');

          const { especificacionTI, atributos, id_monitor, serie_monitor_asignado, ...bienData } = b;
          const bien = repoBien.create({ ...bienData, id_bien, qr_hash });
          await repoBien.save(bien);

          if (especificacionTI) {
            const specs = repoEspecTI.create({ id_bien, ...especificacionTI });
            await repoEspecTI.save(specs);
          }

          if (atributos && atributos.length > 0) {
            for (const attr of atributos) {
              const ba = repoAttr.create({
                id_bien,
                id_atributo: attr.id_atributo,
                valor: attr.valor
              });
              await repoAttr.save(ba);
            }
          }

          if (id_monitor || serie_monitor_asignado) {
            let monitorBien;
            if (id_monitor) {
              monitorBien = await repoBien.findOne({ where: { id_bien: id_monitor } });
            } else {
              monitorBien = await repoBien.findOne({ where: { num_serie: serie_monitor_asignado.trim() } });
            }
            if (!monitorBien) throw new NotFoundError(`Fila ${rowNum}: Monitor asignado no existe.`);

            const actualIdMonitor = monitorBien.id_bien;

            const dup = await repoMonitor.findOne({ where: { id_monitor: actualIdMonitor } });
            if (dup && dup.id_bien !== id_bien) throw new ValidationError(`Fila ${rowNum}: El monitor ya está asignado a otro equipo.`);

            // Sincronizar ubicación
            monitorBien.id_segmento = b.id_segmento;
            monitorBien.id_ubicacion = b.id_ubicacion;
            monitorBien.clave_unidad_ref = b.clave_unidad_ref;
            monitorBien.id_usuario_resguardo = b.id_usuario_resguardo;
            monitorBien.fecha_actualizacion = new Date();
            await repoBien.save(monitorBien);

            if (!dup) {
              const rel = repoMonitor.create({ id_bien, id_monitor: actualIdMonitor });
              await repoMonitor.save(rel);
            }
          }
        }

        await queryRunner.commitTransaction();
        return true;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    },

    updateBien: async (_: unknown, { id_bien, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      ['id_segmento', 'id_ubicacion', 'id_categoria', 'id_unidad_medida', 'id_usuario_resguardo'].forEach(key => {
        if (updates[key] === '') updates[key] = null;
      });

      if (updates.estatus_operativo !== undefined && updates.estatus_operativo.trim() === '') {
        throw new ValidationError('El estatus operativo no puede estar vacío al actualizar.');
      }

      const repo = AppDataSource.getRepository(Bien);
      const bien = await repo.findOne({ where: { id_bien } });
      if (!bien) throw new NotFoundError('Bien');

      if (updates.num_serie && updates.num_serie.trim() !== '') {
        const dupSerie = await repo.findOne({ where: { num_serie: updates.num_serie.trim() } });
        if (dupSerie && dupSerie.id_bien !== id_bien) {
          throw new ValidationError(`El número de serie "${updates.num_serie.trim()}" ya pertenece a otro bien.`);
        }
      }



      if (['INACTIVO', 'BAJA', 'P_BAJA'].includes(updates.estatus_operativo || '')) {
        const cuentaRepo = AppDataSource.getRepository(CuentaPC);
        const progRepo = AppDataSource.getRepository(ProgramasPC);
        const specRepo = AppDataSource.getRepository(EspecificacionTI);

        await cuentaRepo.delete({ id_bien });
        await progRepo.delete({ id_bien });
        await specRepo.update({ id_bien }, {
          dir_ip: null as any,
          nombre_host: null as any,
          modelo_so: null as any,
          version_office: null as any,
          windows_serial: null as any,
          last_scan: null as any,
          puerto_red: null as any,
          switch_red: null as any
        });
      }

      updates.fecha_actualizacion = new Date();
      repo.merge(bien, updates);
      return repo.save(bien);
    },

    updateUsuarioResguardo: async (_: unknown, { id_bien, id_usuario_resguardo }: any, context: GraphQLContext) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(Bien);
      const bien = await repo.findOne({ where: { id_bien } });
      if (!bien) throw new NotFoundError('Bien');
      bien.id_usuario_resguardo = id_usuario_resguardo || null;
      bien.fecha_actualizacion = new Date();
      return repo.save(bien);
    },

    deleteBien: async (_: unknown, { id_bien }: { id_bien: string }, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);

      const incidenciasCount = await AppDataSource.getRepository(Incidencia).count({ where: { id_bien } });
      if (incidenciasCount > 0) {
        throw new ForbiddenError(
          `No se puede eliminar el bien porque tiene ${incidenciasCount} incidencia(s) registrada(s). Resuelva o elimine las incidencias primero.`
        );
      }

      const movimientosCount = await AppDataSource.getRepository(MovimientoInventario).count({ where: { id_bien } });
      if (movimientosCount > 0) {
        throw new ForbiddenError(
          `No se puede eliminar el bien porque tiene ${movimientosCount} movimiento(s) de inventario registrado(s).`
        );
      }

      const notaRepo = AppDataSource.getRepository(Nota);
      const cuentaRepo = AppDataSource.getRepository(CuentaPC);
      const bienRepo = AppDataSource.getRepository(Bien);

      const notas = await notaRepo.find({ where: { id_bien } });
      if (notas.length > 0) await notaRepo.remove(notas);

      const cuentas = await cuentaRepo.find({ where: { id_bien } });
      if (cuentas.length > 0) await cuentaRepo.remove(cuentas);

      const bien = await bienRepo.findOne({ where: { id_bien } });
      if (bien) await bienRepo.remove(bien);
      return true;
    },

    upsertEspecificacionTI: async (_: unknown, { id_bien, ...specs }: any, context: GraphQLContext) => {
      requireAuth(context);

      if (!id_bien || id_bien.trim() === '') {
        throw new ValidationError('No hay un bien asociado a las especificaciones. Guarde el bien general primero.');
      }

      // Si el equipo está INACTIVO, no se deben guardar especificaciones TI
      const bienRepo = AppDataSource.getRepository(Bien);
      const bienCheck = await bienRepo.findOne({ where: { id_bien } });
      if (['INACTIVO', 'BAJA', 'P_BAJA'].includes(bienCheck?.estatus_operativo || '')) {
        const specRepo = AppDataSource.getRepository(EspecificacionTI);
        const existingSpec = await specRepo.findOne({ where: { id_bien } });
        return existingSpec || null;
      }

      // -- Auto-assign id_segmento based on dir_ip --
      if (specs.dir_ip && specs.dir_ip.trim() !== '') {
        try {
          const ipRegex = /^(\d{1,3}\.){3}\d{1,3}/;
          const ips = String(specs.dir_ip).split('/').map(i => i.trim());
          const firstIpStr = ips.find(i => ipRegex.test(i));

          if (firstIpStr) {
            const firstIp = firstIpStr.match(ipRegex)?.[0];
            if (firstIp) {
              const ipToInt = (ip: string) => ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
              const pcIpInt = ipToInt(firstIp);

              const segRepo = AppDataSource.getRepository(Segmento);
              const segmentos = await segRepo.find();

              const match = segmentos.find(s => {
                if (!s.ip || !s.bits) return false;
                try {
                  const networkInt = ipToInt(s.ip);
                  const mask = (~((1 << (32 - s.bits)) - 1)) >>> 0;
                  return (pcIpInt & mask) === (networkInt & mask);
                } catch (e) { return false; }
              });

              if (match) {
                const bienRepo = AppDataSource.getRepository(Bien);
                const bien = await bienRepo.findOne({ where: { id_bien } });
                if (bien && bien.id_segmento !== match.id_segmento) {
                  bien.id_segmento = match.id_segmento;
                  await bienRepo.save(bien);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error al asignar segmento automáticamente:", error);
        }
      } else {
        // Si no hay IP, limpiar el segmento
        const bienRepo = AppDataSource.getRepository(Bien);
        const bien = await bienRepo.findOne({ where: { id_bien } });
        if (bien && bien.id_segmento !== null) {
          bien.id_segmento = null as any;
          await bienRepo.save(bien);
        }
      }

      const repo = AppDataSource.getRepository(EspecificacionTI);
      const existing = await repo.findOne({ where: { id_bien } });
      if (existing) {
        repo.merge(existing, specs);
        return repo.save(existing);
      }
      return repo.save(repo.create({ id_bien, ...specs }));
    },

    // ── Asignar monitor a un equipo (PC o Laptop) ──────────────────────────
    asignarMonitor: async (
      _: unknown,
      { id_bien, id_monitor, forzar = false }: { id_bien: string; id_monitor: string; forzar?: boolean },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      const bienRepo = AppDataSource.getRepository(Bien);
      const monitorRepo = AppDataSource.getRepository(BienMonitor);

      const equipo = await bienRepo.findOne({ where: { id_bien } });
      if (!equipo) throw new NotFoundError('Equipo');

      const monitorBien = await bienRepo.findOne({ where: { id_bien: id_monitor } });
      if (!monitorBien) throw new NotFoundError('Monitor (bien)');

      // Verificar que no esté ya asignado al MISMO equipo
      const dup = await monitorRepo.findOne({ where: { id_bien, id_monitor } });
      if (dup) throw new ValidationError('Este monitor ya está asignado a ese equipo.');

      // Verificar si el monitor está asignado a OTRO equipo
      const relOtroEquipo = await monitorRepo.findOne({ where: { id_monitor } });
      if (relOtroEquipo && relOtroEquipo.id_bien !== id_bien) {
        if (!forzar) {
          // Obtener info del equipo anterior para mostrar en el mensaje
          const equipoAnterior = await bienRepo.findOne({ where: { id_bien: relOtroEquipo.id_bien } });
          const equipoNombre = equipoAnterior
            ? [
              equipoAnterior.num_inv ? `INV: ${equipoAnterior.num_inv}` : null,
              equipoAnterior.num_serie ? `S/N: ${equipoAnterior.num_serie}` : null,
            ]
              .filter(Boolean)
              .join(' / ') || `ID: ${equipoAnterior.id_bien.substring(0, 8)}…`
            : 'otro equipo';
          // Código de extensión para que el front pueda detectarlo
          const err: any = new ValidationError(
            `MONITOR_EN_USO:${equipoNombre}:Este monitor ya está asignado a ${equipoNombre}. ¿Deseas forzar la reasignación?`
          );
          throw err;
        }
        // forzar=true → desasignar del equipo anterior primero
        await monitorRepo.remove(relOtroEquipo);
      }

      // Sincronizar ubicación del monitor con el equipo
      monitorBien.id_segmento = equipo.id_segmento;
      monitorBien.id_ubicacion = equipo.id_ubicacion;
      monitorBien.clave_unidad_ref = equipo.clave_unidad_ref;
      monitorBien.id_usuario_resguardo = equipo.id_usuario_resguardo;
      monitorBien.fecha_actualizacion = new Date();
      await bienRepo.save(monitorBien);

      // Crear la relación
      const rel = monitorRepo.create({ id_bien, id_monitor });
      return monitorRepo.save(rel);
    },

    // ── Desasignar monitor (no borra el bien del inventario) ───────────────
    desasignarMonitor: async (
      _: unknown,
      { id_bien_monitor }: { id_bien_monitor: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      const repo = AppDataSource.getRepository(BienMonitor);
      const rel = await repo.findOne({ where: { id_bien_monitor: parseInt(id_bien_monitor) } });
      if (!rel) throw new NotFoundError('Asignación de monitor');
      await repo.remove(rel);
      return true;
    },

    // ── Procesar monitores WMI (Rol Maestro, directo) ──────────────────────
    procesarMonitoresEquipo: async (
      _: unknown,
      { id_bien_pc, monitores, forzar = false }: { id_bien_pc: string; monitores: MonitorWmiInput[]; forzar?: boolean },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      return AppDataSource.transaction(async (manager) =>
        procesarMonitoresHelper(manager, id_bien_pc, monitores, forzar)
      );
    },

    // ── Cuentas PC ───────────────────────────────────────────────────────
    createCuentaPC: async (
      _: unknown,
      { id_bien, data }: { id_bien: string; data: Partial<CuentaPC> },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(CuentaPC);
      return repo.save(repo.create({ id_bien, ...data }));
    },

    updateCuentaPC: async (
      _: unknown,
      { id_cuenta, data }: { id_cuenta: string; data: Partial<CuentaPC> },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(CuentaPC);
      const cuenta = await repo.findOne({ where: { id_cuenta: parseInt(id_cuenta) } });
      if (!cuenta) throw new NotFoundError('CuentaPC');
      repo.merge(cuenta, data);
      return repo.save(cuenta);
    },

    deleteCuentaPC: async (
      _: unknown,
      { id_cuenta }: { id_cuenta: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(CuentaPC);
      const cuenta = await repo.findOne({ where: { id_cuenta: parseInt(id_cuenta) } });
      if (!cuenta) throw new NotFoundError('CuentaPC');
      await repo.remove(cuenta);
      return true;
    },

    // ── Sincronizar Cuentas PC ─────────────────────────────────────────────
    syncCuentasPC: async (
      _: unknown,
      { id_bien, cuentas }: { id_bien: string; cuentas: Partial<CuentaPC>[] },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      const autoSyncUser = process.env.AUTOSYNC_USER || 'ti_autosync';
      if (context.user?.matricula === autoSyncUser) {
        return true;
      }

      return AppDataSource.transaction(async (manager) => {
        const repo = manager.getRepository(CuentaPC);
        await repo.delete({ id_bien });
        if (cuentas && cuentas.length > 0) {
          const toSave = cuentas.map(c => repo.create({ id_bien, ...c }));
          await repo.save(toSave);
        }

        const bitacoraRepo = manager.getRepository(Bitacora);
        await bitacoraRepo.save(bitacoraRepo.create({
          id_usuario: context.user!.id_usuario,
          accion: 'CREACION_MASIVA',
          tabla_afectada: 'Cuentas_PC',
          registro_afectado: id_bien,
          detalles_movimiento: JSON.stringify({
            mensaje: `Se sincronizaron ${cuentas ? cuentas.length : 0} cuentas_pc.`,
            cuentas: cuentas
          }),
          origen: context.origen || 'WIN'
        }));

        return true;
      });
    },

    // ── Sincronizar Monitores PC ───────────────────────────────────────────
    syncMonitoresPC: async (
      _: unknown,
      { id_bien, monitores }: { id_bien: string; monitores: any[] },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      return AppDataSource.transaction(async (manager) => {
        if (Array.isArray(monitores) && monitores.length > 0) {
          await procesarMonitoresHelper(manager, id_bien, monitores, false);
        }
        return true;
      });
    },

    // ── Programas PC ───────────────────────────────────────────────────────
    syncProgramasPC: async (
      _: unknown,
      { id_bien, programas }: { id_bien: string; programas: Partial<ProgramasPC>[] },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      console.log(`[syncProgramasPC] Recibidos ${programas?.length || 0} programas para el id_bien: ${id_bien}`);
      if (programas && programas.length > 0) {
        console.log(programas);
      }
      return AppDataSource.transaction(async (manager) => {
        const repo = manager.getRepository(ProgramasPC);
        await repo.delete({ id_bien });
        if (programas && programas.length > 0) {
          const mapped = programas.map((p: any) => {
            if (!p.fecha_instalacion || p.fecha_instalacion.trim() === '') {
              p.fecha_instalacion = null;
            } else {
              let f = p.fecha_instalacion.trim();
              if (/^\d{8}$/.test(f)) {
                p.fecha_instalacion = `${f.substring(0, 4)}-${f.substring(4, 6)}-${f.substring(6, 8)}`;
              } else if (f.includes('/')) {
                const parts = f.split('/');
                if (parts.length === 3 && parts[2].length === 4) {
                  p.fecha_instalacion = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                } else if (parts.length === 3 && parts[0].length === 4) {
                  p.fecha_instalacion = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                } else {
                  p.fecha_instalacion = null;
                }
              } else if (f.includes('-')) {
                const parts = f.split('-');
                if (parts.length === 3 && parts[2].length === 4) {
                  p.fecha_instalacion = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
              }
            }

            if (p.programa && p.programa.length > 100) {
              p.programa = p.programa.substring(0, 100);
            }
            if (p.version && p.version.length > 50) {
              p.version = p.version.substring(0, 50);
            }
            return { id_bien, ...p, programa: p.programa };
          });

          // Eliminar duplicados o hacerlos únicos basándose en el nombre del programa
          const uniqueProgramas = [];
          const seenProgramas = new Map<string, any>();

          for (const item of mapped) {
            let key = (item.programa || '').trim().toLowerCase();
            if (!seenProgramas.has(key)) {
              seenProgramas.set(key, item);
              uniqueProgramas.push(item);
            } else {
              // Ya existe un programa con este nombre
              const existing = seenProgramas.get(key);
              const v1 = (existing.version || '').trim().toLowerCase();
              const v2 = (item.version || '').trim().toLowerCase();

              // Si la versión es diferente, diferenciamos el nombre para poder guardar ambos
              if (v1 !== v2 && v2 !== '') {
                item.programa = `${item.programa} (v. ${item.version})`;
                if (item.programa.length > 100) item.programa = item.programa.substring(0, 100);

                let newKey = item.programa.trim().toLowerCase();
                if (!seenProgramas.has(newKey)) {
                  seenProgramas.set(newKey, item);
                  uniqueProgramas.push(item);
                }
              }
              // Si la versión es la misma, es un duplicado idéntico y se ignora
            }
          }

          const toSave = repo.create(uniqueProgramas);
          await repo.save(toSave, { chunk: 100 });
        }

        const bitacoraRepo = manager.getRepository(Bitacora);
        await bitacoraRepo.save(bitacoraRepo.create({
          id_usuario: context.user!.id_usuario,
          accion: 'CREACION_MASIVA',
          tabla_afectada: 'Programas_PC',
          registro_afectado: id_bien,
          detalles_movimiento: JSON.stringify({
            mensaje: `Se sincronizaron ${programas ? programas.length : 0} programas.`
          }),
          origen: context.origen || 'WIN'
        }));

        return true;
      });
    },
  },

  // ── Field resolvers usando DataLoaders
  Bien: {
    categoria: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.id_categoria ? context.loaders.categoriaLoader.load(parent.id_categoria) : null,

    unidadMedida: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.id_unidad_medida ? context.loaders.unidadMedidaLoader.load(parent.id_unidad_medida) : null,

    // Segmento de red (tabla: segmentos)
    segmento: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.id_segmento ? context.loaders.segmentoLoader.load(parent.id_segmento) : null,

    ubicacion: async (parent: Bien) =>
      parent.id_ubicacion
        ? AppDataSource.getRepository((await import('../../entities/Ubicacion')).Ubicacion).findOne({
          where: { id_ubicacion: parent.id_ubicacion },
        })
        : null,

    // Unidad física (tabla: unidades — antes inmuebles)
    unidad: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.clave_unidad_ref ? context.loaders.unidadLoader.load(parent.clave_unidad_ref) : null,

    modelo: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.clave_modelo ? context.loaders.catModeloLoader.load(parent.clave_modelo) : null,

    usuarioResguardo: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.id_usuario_resguardo ? context.loaders.usuarioLoader.load(parent.id_usuario_resguardo) : null,

    especificacionTI: (parent: Bien, _: unknown, context: GraphQLContext) =>
      context.loaders.especificacionTILoader.load(parent.id_bien),

    garantias: (parent: Bien, _: unknown, context: GraphQLContext) =>
      context.loaders.garantiasByBienLoader.load(parent.id_bien),

    notas: (parent: Bien, _: unknown, context: GraphQLContext) =>
      context.loaders.notasByBienLoader.load(parent.id_bien),

    // Monitores asignados al equipo
    monitores: (parent: Bien, _: unknown, context: GraphQLContext) =>
      context.loaders.monitoresByBienLoader.load(parent.id_bien),

    // Para un monitor, obtener el PC al que está asignado
    equipoAsignado: async (parent: Bien) => {
      const rel = await AppDataSource.getRepository(BienMonitor).findOne({ where: { id_monitor: parent.id_bien } });
      return rel || null;
    },

    // Cuentas PC asociadas a este bien (1:N)
    cuentasPC: (parent: Bien, _: unknown, context: GraphQLContext) =>
      context.loaders.cuentasPCByBienLoader.load(parent.id_bien),

    // Programas PC (1:N)
    programasPC: async (parent: Bien) =>
      AppDataSource.getRepository(ProgramasPC).find({ where: { id_bien: parent.id_bien } }),

    inconvenientes: async (parent: Bien, _: unknown, context: GraphQLContext) => {
      const inc: string[] = [];

      // 1. Condición A: Tipo de bien es PC o Laptop y NO tiene num_inv
      let tipo_disp = parent.modelo?.tipo_disp;
      if (tipo_disp === undefined && parent.clave_modelo) {
        const mod = await AppDataSource.getRepository(CatModelo).findOne({ where: { clave_modelo: parent.clave_modelo } });
        tipo_disp = mod?.tipo_disp;
      }
      const isPcOrLaptop = tipo_disp === 3 || tipo_disp === 4;
      const noInv = !parent.num_inv || parent.num_inv === '' || parent.num_inv === 'N/D';
      if (isPcOrLaptop && noInv) {
        inc.push('Sin número de inventario');
      }

      // 2. Condición B: IP Duplicada
      let dir_ip = parent.especificacionTI?.dir_ip;
      if (dir_ip === undefined) {
        const ti = await AppDataSource.getRepository(EspecificacionTI).findOne({ where: { id_bien: parent.id_bien } });
        dir_ip = ti?.dir_ip;
      }
      if (dir_ip && dir_ip.trim() !== '') {
        const count = await AppDataSource.getRepository(EspecificacionTI).count({ where: { dir_ip: dir_ip.trim() } });
        if (count > 1) {
          inc.push('IP Repetida: ' + dir_ip.trim());
        }
      }

      // 3. Condición C: Préstamo Vencido
      const overdueCount = await AppDataSource.getRepository(PrestamoBien)
        .createQueryBuilder('pb')
        .where('pb.id_bien = :id', { id: parent.id_bien })
        .andWhere('pb.fecha_entrega IS NULL')
        .andWhere('pb.fecha_a_terminar_prestamo IS NOT NULL')
        .andWhere('pb.fecha_a_terminar_prestamo < GETDATE()')
        .getCount();
      if (overdueCount > 0) {
        inc.push('Préstamo Vencido / Caducado');
      }

      return inc;
    },

    tiene_cambios_pendientes: async (parent: Bien) => {
      const { SolicitudCambio } = await import('../../entities/SolicitudCambio');
      const count = await AppDataSource.getRepository(SolicitudCambio).count({
        where: { bien_id: parent.id_bien, estado: 'PENDIENTE' }
      });
      return count > 0;
    }
  },

  // ── Field resolvers de BienMonitor ──────────────────────────────────────
  BienMonitor: {
    monitor: async (parent: BienMonitor) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_monitor } }),
    equipo: async (parent: BienMonitor) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_bien } }),
  },

  EspecificacionTI: {
    bien: async (parent: EspecificacionTI) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_bien } }),
  },

  CuentaPC: {
    bien: async (parent: CuentaPC) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_bien } }),
  },

  ProgramasPC: {
    bien: async (parent: ProgramasPC) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_bien } }),
  },
};
