import { encodeCursor, decodeCursor, buildPaginatedResponse } from '../pagination';

describe('Funciones de Paginación', () => {
  describe('encodeCursor', () => {
    it('Debe codificar correctamente un ID numérico a base64', () => {
      const id = 123;
      const cursor = encodeCursor(id);
      expect(cursor).toBe(Buffer.from('123').toString('base64'));
    });

    it('Debe codificar correctamente un ID de cadena texto a base64', () => {
      const id = 'abc';
      const cursor = encodeCursor(id);
      expect(cursor).toBe(Buffer.from('abc').toString('base64'));
    });
  });

  describe('decodeCursor', () => {
    it('Debe decodificar correctamente un string en base64 a su valor original', () => {
      const originalValue = '456';
      const cursor = Buffer.from(originalValue).toString('base64');
      
      const decoded = decodeCursor(cursor);
      expect(decoded).toBe(originalValue);
    });
  });

  describe('buildPaginatedResponse', () => {
    it('Debe construir una conexión de paginación con pageInfo correcto - Sin HasNextPage', () => {
      const items = [{ id_bien: 'A' }, { id_bien: 'B' }];
      const totalCount = 2;
      const args = { first: 10 };
      
      const result = buildPaginatedResponse(items, totalCount, args, (item) => item.id_bien as string);

      expect(result.edges).toHaveLength(2);
      expect(result.edges[0].node.id_bien).toBe('A');
      expect(result.edges[0].cursor).toBe(encodeCursor('A'));

      expect(result.pageInfo.totalCount).toBe(2);
      expect(result.pageInfo.hasNextPage).toBe(false); // Porque hay 2 items y el límite era 10
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBe(encodeCursor('A'));
      expect(result.pageInfo.endCursor).toBe(encodeCursor('B'));
    });

    it('Debe construir una conexión de paginación e indicar si tiene siguiente página', () => {
      // Simulamos que pedimos 2 items y nos llegaron 2
      const items = [{ id_bien: '1' }, { id_bien: '2' }];
      const totalCount = 10;
      const args = { first: 2 };
      
      const result = buildPaginatedResponse(items, totalCount, args, (item) => item.id_bien as string);

      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it('Debe indicar que tiene una página anterior si se pasó after o before como argumento', () => {
      const items = [{ id_bien: '3' }];
      const totalCount = 10;
      const args = { first: 1, after: encodeCursor('2') };
      
      const result = buildPaginatedResponse(items, totalCount, args, (item) => item.id_bien as string);

      expect(result.pageInfo.hasPreviousPage).toBe(true);
    });
  });
});
