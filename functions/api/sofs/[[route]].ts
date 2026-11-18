import { handleSofsApiRequest, type SofsBackendEnv } from '../../../server/sofsBackend';

interface PagesContext {
  request: Request;
  env: SofsBackendEnv;
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  return handleSofsApiRequest(context.request, context.env);
};

export const onRequestOptions = async (context: PagesContext): Promise<Response> => {
  return handleSofsApiRequest(context.request, context.env);
};
