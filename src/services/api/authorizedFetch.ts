import { getFreshFirebaseIdToken } from '../auth/firebaseAuth';

export interface AuthorizedFetchDeps {
  getIdToken?: (forceRefresh?: boolean) => Promise<string | null>;
  fetchImpl?: typeof fetch;
}

export async function authorizedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  deps: AuthorizedFetchDeps = {}
): Promise<Response> {
  const resolveToken = deps.getIdToken ?? (() => getFreshFirebaseIdToken(false));
  const fetchFn = deps.fetchImpl ?? fetch;

  const headers = new Headers(init.headers);
  const idToken = await resolveToken(false);
  if (idToken) {
    headers.set('Authorization', `Bearer ${idToken}`);
  }

  return fetchFn(input, {
    ...init,
    headers,
  });
}
