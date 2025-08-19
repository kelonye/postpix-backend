export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function retry<T>(
  run: () => Promise<T>,
  confirm: (t: T) => boolean,
  maxRetries: number = 30,
  retryIndex: number = 0,
  delay: number = 5_000
) {
  if (maxRetries === retryIndex) throw new Error('Max retries reached');

  const retryFn = () => {
    return new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(retry<T>(run, confirm, maxRetries, retryIndex + 1, delay));
        } catch (e) {
          reject(e);
        }
      }, delay);
    });
  };

  let result: T;
  try {
    result = await run();
  } catch {
    return retryFn();
  }
  if (!confirm(result)) {
    return retryFn();
  }
  return result;
}
