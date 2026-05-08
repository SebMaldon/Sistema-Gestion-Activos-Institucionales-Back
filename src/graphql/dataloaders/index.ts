import DataLoader from 'dataloader';
import { In } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Marca } from '../../entities/Marca';
import { TipoDispositivo } from '../../entities/TipoDispositivo';
import { CatModelo } from '../../entities/CatModelo';
import { Usuario } from '../../entities/Usuario';
import { CatInmueble } from '../../entities/CatInmueble';
import { EspecificacionTI } from '../../entities/EspecificacionTI';
import { Garantia } from '../../entities/Garantia';
import { CatCategoriaActivo } from '../../entities/CatCategoriaActivo';
import { CatUnidadMedida } from '../../entities/CatUnidadMedida';
import { Unidad } from '../../entities/Unidad';
import { Rol } from '../../entities/Rol';
import { Bien } from '../../entities/Bien';
import { TipoIncidencia } from '../../entities/TipoIncidencia';
import { Nota } from '../../entities/Nota';

function toMap<K, V>(items: V[], keyFn: (item: V) => K): Map<K, V> {
  return new Map<K, V>(items.map((item) => [keyFn(item), item] as [K, V]));
}

export function createDataLoaders() {
  // ── Marcas (clave_marca: int)
  const marcaLoader = new DataLoader<number, Marca | undefined>(async (keys) => {
    const items = await AppDataSource.getRepository(Marca).find({
      where: { clave_marca: In(keys as number[]) },
    });
    const map = toMap<number, Marca>(items, (m) => m.clave_marca);
    return keys.map((k) => map.get(k));
  });

  // ── Tipos de Dispositivo (tipo_disp: int)
  const tipoDispositivoLoader = new DataLoader<number, TipoDispositivo | undefined>(async (keys) => {
    const items = await AppDataSource.getRepository(TipoDispositivo).find({
      where: { tipo_disp: In(keys as number[]) },
    });
    const map = toMap<number, TipoDispositivo>(items, (t) => t.tipo_disp);
    return keys.map((k) => map.get(k));
  });

  // ── Modelos (clave_modelo: string)
  const catModeloLoader = new DataLoader<string, CatModelo | undefined>(async (keys) => {
    const items = await AppDataSource.getRepository(CatModelo).find({
      where: { clave_modelo: In(keys as string[]) },
    });
    const map = toMap<string, CatModelo>(items, (m) => m.clave_modelo);
    return keys.map((k) => map.get(k));
  });

  // ── Usuarios (id_usuario: int)
  const usuarioLoader = new DataLoader<number, Usuario | undefined>(async (keys) => {
    const items = await AppDataSource.getRepository(Usuario).find({
      where: { id_usuario: In(keys as number[]) },
    });
    const map = toMap<number, Usuario>(items, (u) => u.id_usuario);
    return keys.map((k) => map.get(k));
  });

  // ── Cat_Inmuebles (clave_inmueble: string)
  const catInmuebleLoader = new DataLoader<string, CatInmueble | undefined>(async (keys) => {
    const items = await AppDataSource.getRepository(CatInmueble).find({
      where: { clave_inmueble: In(keys as string[]) },
    });
    const map = toMap<string, CatInmueble>(items, (i) => i.clave_inmueble);
    return keys.map((k) => map.get(k));
  });

  // ── Especificaciones TI (id_bien: string/UUID)
  const especificacionTILoader = new DataLoader<string, EspecificacionTI | undefined>(async (keys) => {
    const items = await AppDataSource.getRepository(EspecificacionTI).find({
      where: { id_bien: In(keys as string[]) },
    });
    const map = toMap<string, EspecificacionTI>(items, (s) => s.id_bien);
    return keys.map((k) => map.get(k));
  });

  // ── Garantías agrupadas por id_bien
  const garantiasByBienLoader = new DataLoader<string, Garantia[]>(async (keys) => {
    const items = await AppDataSource.getRepository(Garantia).find({
      where: { id_bien: In(keys as string[]) },
    });
    const map = new Map<string, Garantia[]>();
    items.forEach((g: Garantia) => {
      const arr = map.get(g.id_bien) ?? [];
      arr.push(g);
      map.set(g.id_bien, arr);
    });
    return keys.map((k) => map.get(k) ?? []);
  });

  // ── Categorías Activo (id_categoria: int)
  const categoriaLoader = new DataLoader<number, CatCategoriaActivo | undefined>(async (keys) => {
    const items = await AppDataSource.getRepository(CatCategoriaActivo).find({
      where: { id_categoria: In(keys as number[]) },
    });
    const map = toMap<number, CatCategoriaActivo>(items, (c) => c.id_categoria);
    return keys.map((k) => map.get(k));
  });

  // ── Cat_UnidadesMedida (id_unidad_medida: int) — PK correcta en la DB
  const unidadMedidaLoader = new DataLoader<number, CatUnidadMedida | undefined>(async (keys) => {
    const items = await AppDataSource.getRepository(CatUnidadMedida).find({
      where: { id_unidad_medida: In(keys as number[]) },
    });
    const map = toMap<number, CatUnidadMedida>(items, (u) => u.id_unidad_medida);
    return keys.map((k) => map.get(k));
  });

  // ── Unidades operativas (id_unidad: int)
  const unidadLoader = new DataLoader<number, Unidad | undefined>(async (keys) => {
    const items = await AppDataSource.getRepository(Unidad).find({
      where: { id_unidad: In(keys as number[]) },
    });
    const map = toMap<number, Unidad>(items, (u) => u.id_unidad);
    return keys.map((k) => map.get(k));
  });

  // ── Roles (id_rol: int)
  const rolLoader = new DataLoader<number, Rol | undefined>(async (keys) => {
    const items = await AppDataSource.getRepository(Rol).find({
      where: { id_rol: In(keys as number[]) },
    });
    const map = toMap<number, Rol>(items, (r) => r.id_rol);
    return keys.map((k) => map.get(k));
  });

  // ── Bienes por id_bien (string) — elimina N+1 en Incidencia.bien
  const bienLoader = new DataLoader<string, Bien | undefined>(async (keys) => {
    const items = await AppDataSource.getRepository(Bien).find({
      where: { id_bien: In(keys as string[]) },
    });
    const map = toMap<string, Bien>(items, (b) => b.id_bien);
    return keys.map((k) => map.get(k));
  });

  // ── TiposIncidencia por id (int) — elimina N+1 en Incidencia.tipoIncidencia
  const tipoIncidenciaLoader = new DataLoader<number, TipoIncidencia | undefined>(async (keys) => {
    const items = await AppDataSource.getRepository(TipoIncidencia).find({
      where: { id_tipo_incidencia: In(keys as number[]) },
    });
    const map = toMap<number, TipoIncidencia>(items, (t) => t.id_tipo_incidencia);
    return keys.map((k) => map.get(k));
  });

  // ── Notas agrupadas por id_incidencia — elimina N+1 en Incidencia.notas
  const notasByIncidenciaLoader = new DataLoader<number, Nota[]>(async (keys) => {
    const items = await AppDataSource.getRepository(Nota).find({
      where: { id_incidencia: In(keys as number[]) },
      order: { fecha_creacion: 'ASC' },
    });
    const map = new Map<number, Nota[]>();
    items.forEach((n: Nota) => {
      // id_incidencia es opcional (una nota puede pertenecer a un bien en vez de a una incidencia)
      if (n.id_incidencia == null) return;
      const arr = map.get(n.id_incidencia) ?? [];
      arr.push(n);
      map.set(n.id_incidencia, arr);
    });
    return keys.map((k) => map.get(k) ?? []);
  });

  // ── Notas agrupadas por id_bien — elimina N+1 en Bien.notas
  const notasByBienLoader = new DataLoader<string, Nota[]>(async (keys) => {
    const items = await AppDataSource.getRepository(Nota).find({
      where: { id_bien: In(keys as string[]) },
      order: { fecha_creacion: 'DESC' },
    });
    const map = new Map<string, Nota[]>();
    items.forEach((n: Nota) => {
      if (!n.id_bien) return;
      const arr = map.get(n.id_bien) ?? [];
      arr.push(n);
      map.set(n.id_bien, arr);
    });
    return keys.map((k) => map.get(k) ?? []);
  });

  return {
    marcaLoader,
    tipoDispositivoLoader,
    catModeloLoader,
    usuarioLoader,
    catInmuebleLoader,
    especificacionTILoader,
    garantiasByBienLoader,
    categoriaLoader,
    unidadMedidaLoader,
    unidadLoader,
    rolLoader,
    bienLoader,
    tipoIncidenciaLoader,
    notasByIncidenciaLoader,
    notasByBienLoader,
  };
}

export type DataLoaders = ReturnType<typeof createDataLoaders>;
