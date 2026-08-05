import { AppDataSource } from '../../config/database';
import { GraphQLContext } from '../../middleware/context';

export const monitoreoResolvers = {
  Query: {
    monitoreoImpresiones: async (
      _parent: any,
      args: {
        search?: string;
        version?: string;
        ubicacion?: string;
        unidades?: string[];
        fechaInicio?: string;
        fechaFin?: string;
        sortBy?: string;
        sortOrder?: string;
        pagination?: { first?: number; page?: number };
      },
      context: GraphQLContext
    ) => {
      // Auth Check - only ROL 1 (Maestro)
      if (!context.user) throw new Error('No autorizado');
      if (context.user.id_rol !== 1) throw new Error('Acceso denegado: solo maestros');

      const first = args.pagination?.first || 30;
      const page = args.pagination?.page || 1;
      const offset = (page - 1) * first;

      let baseQuery = `
        FROM bienes b
        INNER JOIN unidades u 
            ON b.clave_unidad_ref = u.clave 
        INNER JOIN monitoreo_limpieza m 
            ON b.num_serie = m.noserie 
        INNER JOIN impresiones i 
            ON b.num_serie = i.noserie
        INNER JOIN Ubicaciones ub
            ON ub.id_ubicacion = b.id_ubicacion
        INNER JOIN Especificaciones_TI e
            ON e.id_bien = b.id_bien
        WHERE 1=1
      `;

      const parameters: any[] = [];

      if (args.search) {
        baseQuery += ` AND (b.num_serie LIKE @${parameters.length} OR e.dir_ip LIKE @${parameters.length})`;
        parameters.push(`%${args.search}%`);
      }
      if (args.version) {
        baseQuery += ` AND m.version LIKE @${parameters.length}`;
        parameters.push(`%${args.version}%`);
      }
      if (args.ubicacion) {
        baseQuery += ` AND ub.nombre_ubicacion LIKE @${parameters.length}`;
        parameters.push(`%${args.ubicacion}%`);
      }
      if (args.unidades && args.unidades.length > 0) {
        const placeholders = [];
        for (const unidad of args.unidades) {
          placeholders.push(`@${parameters.length}`);
          parameters.push(unidad);
        }
        baseQuery += ` AND b.clave_unidad_ref IN (${placeholders.join(',')})`;
      }
      if (args.fechaInicio) {
        let fInicio: any = args.fechaInicio;
        if (fInicio instanceof Date) fInicio = fInicio.toISOString();
        fInicio = String(fInicio).substring(0, 10);
        baseQuery += ` AND CAST(i.fecha AS DATE) >= @${parameters.length}`;
        parameters.push(fInicio);
      }
      if (args.fechaFin) {
        let fFin: any = args.fechaFin;
        if (fFin instanceof Date) fFin = fFin.toISOString();
        fFin = String(fFin).substring(0, 10);
        baseQuery += ` AND CAST(i.fecha AS DATE) <= @${parameters.length}`;
        parameters.push(fFin);
      }

      // 1. Get Total Count
      const countQuery = `
        SELECT COUNT(DISTINCT b.num_serie) as total
        ${baseQuery}
      `;
      
      const countResult = await AppDataSource.query(countQuery, parameters);
      const totalCount = parseInt(countResult[0]?.total || '0', 10);

      // 1.5 Get Total Impressions Sum
      const totalImpQuery = `
        SELECT SUM(i.impresiones) as sum_total
        ${baseQuery}
      `;
      const sumResult = await AppDataSource.query(totalImpQuery, parameters);
      const totalImpresiones = parseInt(sumResult[0]?.sum_total || '0', 10);

      // 2. Get Data
      let dataQuery = `
        SELECT 
          b.num_serie,
          e.dir_ip,
          u.descripcion, 
          SUM(i.impresiones) AS total_impresiones,
          m.version,
          ub.nombre_ubicacion,
          MIN(i.fecha) AS raw_fecha_min,
          CONVERT(varchar, MIN(i.fecha), 23) AS fecha_min,
          CONVERT(varchar, MAX(i.fecha), 23) AS fecha_max
        ${baseQuery}
        GROUP BY 
          b.num_serie,
          u.descripcion,
          m.version,
          ub.nombre_ubicacion,
          e.dir_ip
      `;

      // Sorting
      const validColumns = ['num_serie', 'dir_ip', 'descripcion', 'total_impresiones', 'version', 'nombre_ubicacion', 'fecha'];
      let sortBy = 'b.num_serie';
      let sortDir = 'ASC';

      if (args.sortBy && validColumns.includes(args.sortBy)) {
        if (args.sortBy === 'num_serie') sortBy = 'b.num_serie';
        else if (args.sortBy === 'dir_ip') sortBy = 'e.dir_ip';
        else if (args.sortBy === 'descripcion') sortBy = 'u.descripcion';
        else if (args.sortBy === 'total_impresiones') sortBy = 'SUM(i.impresiones)';
        else if (args.sortBy === 'version') sortBy = 'm.version';
        else if (args.sortBy === 'nombre_ubicacion') sortBy = 'ub.nombre_ubicacion';
        else if (args.sortBy === 'fecha') sortBy = 'MIN(i.fecha)';
      }
      if (args.sortOrder && ['ASC', 'DESC'].includes(args.sortOrder.toUpperCase())) {
        sortDir = args.sortOrder.toUpperCase();
      }

      dataQuery += ` ORDER BY ${sortBy} ${sortDir} OFFSET ${offset} ROWS FETCH NEXT ${first} ROWS ONLY`;

      const results = await AppDataSource.query(dataQuery, parameters);

      const edges = results.map((row: any, index: number) => ({
        node: {
          num_serie: row.num_serie,
          dir_ip: row.dir_ip,
          descripcion: row.descripcion,
          total_impresiones: row.total_impresiones,
          version: row.version,
          nombre_ubicacion: row.nombre_ubicacion,
          fecha_min: row.fecha_min,
          fecha_max: row.fecha_max,
        },
        cursor: Buffer.from(`monitoreo_${offset + index}`).toString('base64'),
      }));

      const hasNextPage = offset + edges.length < totalCount;
      const hasPreviousPage = offset > 0;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
          totalCount,
        },
        totalImpresiones,
      };
    },

    monitoreoResumenUnidades: async (_parent: any, _args: any, context: GraphQLContext) => {
      if (!context.user) throw new Error('No autorizado');
      if (context.user.id_rol !== 1) throw new Error('Acceso denegado: solo maestros');

      const query = `
        SELECT u.clave, SUM(i.impresiones) as total
        FROM unidades u
        INNER JOIN bienes b ON b.clave_unidad_ref = u.clave
        INNER JOIN impresiones i ON i.noserie = b.num_serie
        GROUP BY u.clave
      `;
      const result = await AppDataSource.query(query);
      return result.map((r: any) => ({
        clave: r.clave,
        total_impresiones: parseInt(r.total || '0', 10)
      }));
    },
  },
};
