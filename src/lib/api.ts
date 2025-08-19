export class ApiError extends Error {
  code: string;

  constructor({ code }: { code: string }) {
    super(code);
    this.code = code;
  }
}

export async function api<T, U>(path: string, body: T): Promise<U> {
  const res = await fetch('/api/ai' + path, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (res.status !== 200) {
    throw new Error(await res.text());
  }

  return res.json();
}
