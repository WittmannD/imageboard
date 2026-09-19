export interface ModalData {
  name: string | null;
  params: Record<string, string>;
}

export function getModal(request: Request): ModalData | null {
  const searchParams = new URL(request.url).searchParams;
  const modal = searchParams.get('modal');

  if (!modal) {
    return null;
  }

  const params: Record<string, string> = {};
  for (const [key, value] of searchParams) {
    if (key !== 'modal') {
      params[key] = value;
    }
  }

  return { name: modal, params };
}