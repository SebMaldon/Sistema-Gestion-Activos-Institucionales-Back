import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Bitacora } from '../entities/Bitacora';
import { sessionContext } from '../utils/asyncLocalStorage';

@EventSubscriber()
export class BitacoraSubscriber implements EntitySubscriberInterface {
  


  async afterInsert(event: InsertEvent<any>) {
    // Evitar bucles infinitos: no auditar la tabla Bitacora
    if (event.metadata.targetName === 'Bitacora' || !event.entity) return;

    // Extraer usuario del contexto global o del queryRunner (retrocompatibilidad)
    const store = sessionContext.getStore();
    const usuarioId = store?.usuarioId || event.queryRunner?.data?.usuarioId;
    
    if (!usuarioId) return; // Si no hay usuario, ignoramos (ej. seeds o tareas background internas)

    const detalles = JSON.stringify(event.entity);

    await this.guardarEnBitacora(
      event,
      usuarioId,
      'CREACION',
      event.metadata.tableName,
      this.obtenerIdEntidad(event),
      detalles
    );
  }

  async afterUpdate(event: UpdateEvent<any>) {
    if (event.metadata.targetName === 'Bitacora' || !event.entity) return;

    const store = sessionContext.getStore();
    const usuarioId = store?.usuarioId || event.queryRunner?.data?.usuarioId;
    if (!usuarioId) return;

    // En un update, TypeORM a veces solo manda en 'entity' las columnas cambiadas.
    // Necesitamos el ID para el registro_afectado.
    const entityId = this.obtenerIdEntidad(event);

    const detalles = JSON.stringify({
      estadoAnterior: event.databaseEntity,
      estadoNuevo: event.entity,
      columnasModificadas: event.updatedColumns.map((col) => col.propertyName),
    });

    await this.guardarEnBitacora(
      event,
      usuarioId,
      'EDICION',
      event.metadata.tableName,
      entityId,
      detalles
    );
  }

  async afterRemove(event: RemoveEvent<any>) {
    if (event.metadata.targetName === 'Bitacora' || !event.databaseEntity) return;

    const store = sessionContext.getStore();
    const usuarioId = store?.usuarioId || event.queryRunner?.data?.usuarioId;
    if (!usuarioId) return;

    // En un delete, usualmente solo tenemos el estado en la base de datos (databaseEntity)
    const detalles = JSON.stringify(event.databaseEntity);

    await this.guardarEnBitacora(
      event,
      usuarioId,
      'ELIMINACION',
      event.metadata.tableName,
      this.obtenerIdEntidad(event),
      detalles
    );
  }

  // --- Funciones Auxiliares ---

  /**
   * Obtiene la llave primaria de la entidad, incluso si la llave primaria tiene otro nombre distinto a "id"
   */
  private obtenerIdEntidad(event: any): string | null {
    // 1. Intentar obtenerlo del entityId (disponible en RemoveEvent e InsertEvent post-save)
    if (event.entityId) {
      if (typeof event.entityId === 'object') {
        return String(Object.values(event.entityId)[0]);
      }
      return String(event.entityId);
    }

    // 2. Fallback a buscar en la entidad por el nombre de la propiedad de la PK
    const primaryColumns = event.metadata.primaryColumns;
    if (primaryColumns.length > 0) {
      const propertyName = primaryColumns[0].propertyName;
      
      // En updates, el PK suele estar en databaseEntity si no se incluyó en la actualización
      const entity = event.entity?.[propertyName] !== undefined ? event.entity : event.databaseEntity;
      
      if (entity && entity[propertyName] !== undefined && entity[propertyName] !== null) {
        return String(entity[propertyName]);
      }
    }
    return null;
  }

  /**
   * Guarda el registro en la bitácora utilizando la MISMA transacción del evento
   */
  private async guardarEnBitacora(
    event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>,
    usuarioId: number,
    accion: string,
    tablaAfectada: string,
    registroAfectado: string | null,
    detalles: string
  ) {
    const bitacora = new Bitacora();
    // Ajusta las propiedades si en tu entidad los nombres son distintos
    bitacora.id_usuario = usuarioId;
    bitacora.accion = accion;
    bitacora.tabla_afectada = tablaAfectada;
    bitacora.registro_afectado = registroAfectado || 'N/A';
    bitacora.detalles_movimiento = detalles;

    // CRUCIAL: Usamos event.manager para asegurar que la inserción de la bitácora 
    // ocurra dentro de la misma transacción de la consulta original.
    await event.manager.save(Bitacora, bitacora);
  }
}
