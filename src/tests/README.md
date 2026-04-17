# Pruebas Unitarias (Unit Tests)

Esta carpeta contiene todas las pruebas unitarias del backend utilizando **Jest** y **ts-jest**.

## Estructura

Se recomienda utilizar el siguiente formato para nombrar los archivos de prueba para que Jest los detecte automáticamente:
* `*.test.ts`
* `*.spec.ts`

Puedes organizar las pruebas dentro de esta carpeta por subcarpetas (ej. `resolvers/`, `services/`, `models/`).

## Comandos

Para ejecutar las pruebas unitarias, dispones de los siguientes comandos a través de `npm`:

```bash
# Ejecutar todas las pruebas una sola vez
npm run test

# Ejecutar las pruebas en modo watch (se vuelven a ejecutar al guardar un archivo)
npm run test -- --watch
```

## Ejemplo Básico

Revisa el archivo `example.test.ts` para ver cómo se estructura un caso de prueba con Jest.

```typescript
describe('Suite de pruebas de ejemplo', () => {
  it('Debería sumar dos números correctamente', () => {
    expect(1 + 2).toBe(3);
  });
});
```
