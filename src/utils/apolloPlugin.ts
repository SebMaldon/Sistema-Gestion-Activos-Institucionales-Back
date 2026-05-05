import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLContext } from '../middleware/context';
import { sessionContext } from './asyncLocalStorage';

export const asyncContextPlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    return {
      async executionDidStart({ contextValue }) {
        // Obtenemos el usuario de contextValue (generado por buildContext)
        const usuarioId = contextValue.user?.id_usuario;
        
        // Entrar a la zona asíncrona (Aplica a toda la ejecución de los resolvers)
        sessionContext.enterWith({ usuarioId });
      },
    };
  },
};
