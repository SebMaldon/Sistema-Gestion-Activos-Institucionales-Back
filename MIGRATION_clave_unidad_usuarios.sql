-- ============================================================
-- MIGRACIÓN: Agregar columna clave_unidad a la tabla Usuarios
-- ============================================================
-- Este script:
--   1. Agrega la columna clave_unidad (si no existe)
--   2. Crea la FK hacia unidades(clave)  (si no existe)
--   3. Llena clave_unidad consultando la clave de la unidad
--      desde el segmento asignado a cada usuario
--
-- La lógica de llenado es:
--   Usuarios.id_unidad  -->  segmentos.id_segmento
--   segmentos.clave     -->  unidades.clave
--
-- Ejecutar en: USE inventario;
-- ============================================================

USE inventario;
GO

-- ─── PASO 1: Agregar la columna si aún no existe ─────────────
IF NOT EXISTS (
    SELECT 1
    FROM   sys.columns
    WHERE  object_id = OBJECT_ID('dbo.Usuarios')
      AND  name      = 'clave_unidad'
)
BEGIN
    ALTER TABLE dbo.Usuarios
        ADD clave_unidad VARCHAR(50) NULL;
    PRINT 'Columna clave_unidad agregada a Usuarios.';
END
ELSE
BEGIN
    PRINT 'La columna clave_unidad ya existía en Usuarios.';
END
GO

-- ─── PASO 2: Crear la FK hacia unidades(clave) si aún no existe ──
IF NOT EXISTS (
    SELECT 1
    FROM   sys.foreign_keys
    WHERE  name        = 'FK_Usuarios_Unidades'
      AND  parent_object_id = OBJECT_ID('dbo.Usuarios')
)
BEGIN
    ALTER TABLE dbo.Usuarios
        ADD CONSTRAINT FK_Usuarios_Unidades
        FOREIGN KEY (clave_unidad)
        REFERENCES dbo.unidades(clave);
    PRINT 'FK FK_Usuarios_Unidades creada.';
END
ELSE
BEGIN
    PRINT 'La FK FK_Usuarios_Unidades ya existía.';
END
GO

-- ─── PASO 3 (OPCIONAL): Renombrar la FK antigua si aún tiene el nombre incorrecto ──
-- Si la FK sobre id_unidad todavía se llama FK_Usuarios_Unidades (nombre erróneo),
-- se renombra a FK_Usuarios_Segmentos para reflejar que apunta a segmentos.
IF EXISTS (
    SELECT 1
    FROM   sys.foreign_keys fk
    JOIN   sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN   sys.columns c ON fkc.parent_object_id = c.object_id
                         AND fkc.parent_column_id  = c.column_id
    WHERE  fk.name            = 'FK_Usuarios_Unidades'
      AND  fk.parent_object_id = OBJECT_ID('dbo.Usuarios')
      AND  c.name             = 'id_unidad'   -- confirma que apunta a id_unidad (no a clave_unidad)
)
BEGIN
    -- Primero eliminamos la FK con nombre incorrecto
    ALTER TABLE dbo.Usuarios DROP CONSTRAINT FK_Usuarios_Unidades;
    -- La recreamos con el nombre correcto
    ALTER TABLE dbo.Usuarios
        ADD CONSTRAINT FK_Usuarios_Segmentos
        FOREIGN KEY (id_unidad)
        REFERENCES dbo.segmentos(id_segmento);
    PRINT 'FK renombrada: FK_Usuarios_Unidades -> FK_Usuarios_Segmentos (apunta a segmentos).';
END
GO

-- ─── PASO 4: Llenar clave_unidad desde el segmento asignado al usuario ───────
--
-- Por cada usuario que tenga id_unidad (FK a segmentos),
-- buscamos el segmento correspondiente y tomamos su campo clave,
-- que a su vez es FK a unidades(clave).
--
UPDATE u
SET    u.clave_unidad = s.clave
FROM   dbo.Usuarios  u
JOIN   dbo.segmentos s ON u.id_unidad = s.id_segmento
WHERE  u.id_unidad    IS NOT NULL   -- usuario tiene segmento asignado
  AND  s.clave        IS NOT NULL   -- el segmento tiene una unidad física referenciada
  AND  u.clave_unidad IS NULL;      -- solo actualizar los que aún están vacíos

-- Mostrar cuántos registros se actualizaron
DECLARE @cnt INT = @@ROWCOUNT;
PRINT CONCAT('Registros actualizados: ', @cnt);
GO

-- ─── VERIFICACIÓN: Resumen de usuarios y sus asignaciones ─────────────────────
SELECT
    u.id_usuario,
    u.matricula,
    u.nombre_completo,
    u.id_unidad      AS segmento_id,
    s.clave          AS segmento_clave,
    s.Nombre         AS segmento_nombre,
    u.clave_unidad   AS clave_unidad_asignada,
    un.descripcion   AS unidad_descripcion
FROM  dbo.Usuarios  u
LEFT JOIN dbo.segmentos s  ON u.id_unidad    = s.id_segmento
LEFT JOIN dbo.unidades  un ON u.clave_unidad = un.clave
ORDER BY u.nombre_completo;
GO
