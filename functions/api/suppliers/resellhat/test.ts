import { handleResellHatTestConnection, type ProxyEnv } from '../../../../server/resellhatProxy';

interface PagesContext {
  request: Request;
  env: ProxyEnv;
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  return handleResellHatTestConnection(context.request, context.env);
}

export async function onRequestOptions(context: PagesContext): Promise<Response> {
  return handleResellHatTestConnection(context.request, context.env);
}

export async function onRequest(context: PagesContext): Promise<Response> {
  return handleResellHatTestConnection(context.request, context.env);
}
