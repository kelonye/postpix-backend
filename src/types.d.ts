declare module 'batch' {
  export default class Batch<T> {
    concurrency(concurrency: number): this;
    push(fn: (done: (err: Error | null, result?: T) => void) => void): this;
    end(callback: (err: Error | null, result?: T[]) => void): this;
  }
}
