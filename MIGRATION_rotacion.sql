-- ==========================================
-- MIGRACIÓN: Agregar campos a tabla rotacion
-- Ejecutar en SQL Server Management Studio
-- ==========================================

USE inventario;
GO

-- Agregar campo posicion si no existe
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'rotacion' AND COLUMN_NAME = 'posicion'
)
BEGIN
    ALTER TABLE rotacion ADD posicion INT DEFAULT 0;
    PRINT 'Campo posicion agregado.';
END
ELSE
    PRINT 'Campo posicion ya existe.';
GO

-- Agregar campo es_turno_actual (puntero de cola)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'rotacion' AND COLUMN_NAME = 'es_turno_actual'
)
BEGIN
    ALTER TABLE rotacion ADD es_turno_actual BIT DEFAULT 0;
    PRINT 'Campo es_turno_actual agregado.';
END
ELSE
    PRINT 'Campo es_turno_actual ya existe.';
GO

-- Inicializar posicion para registros existentes (por si ya hay datos)
UPDATE r
SET r.posicion = seq.rn
FROM rotacion r
INNER JOIN (
    SELECT id_rotacion,
           ROW_NUMBER() OVER (PARTITION BY id_unidad ORDER BY id_rotacion ASC) AS rn
    FROM rotacion
) seq ON r.id_rotacion = seq.id_rotacion
WHERE r.posicion = 0;
GO

-- Inicializar puntero: el primer técnico activo por unidad recibe el turno
UPDATE r
SET r.es_turno_actual = 1
FROM rotacion r
INNER JOIN (
    SELECT MIN(id_rotacion) AS id_rotacion
    FROM rotacion
    WHERE estatus = 1
    GROUP BY id_unidad
) primeros ON r.id_rotacion = primeros.id_rotacion;
GO

PRINT 'Migración completada exitosamente.';
