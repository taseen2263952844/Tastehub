import { handlePublicAdmissionSubmit, type SofsAdmissionEnv } from '../../../server/sofsAdmissions';

interface PagesContext {
  request: Request;
  env: SofsAdmissionEnv;
}

export const onRequestPost = async (context: PagesContext): Promise<Response> => {
  return handlePublicAdmissionSubmit(context.request, context.env);
};

export const onRequestOptions = async (context: PagesContext): Promise<Response> => {
  return handlePublicAdmissionSubmit(context.request, context.env);
};

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  return handlePublicAdmissionSubmit(context.request, context.env);
};

export const onRequest = async (context: PagesContext): Promise<Response> => {
  return handlePublicAdmissionSubmit(context.request, context.env);
};
