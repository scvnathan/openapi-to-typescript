export abstract class Formatter<T> {
  public abstract render(arg: T): Promise<string>
  public async renderToString(operations: T[]) {
    return Promise.all(operations.map(
      (operation: T) => this.render(operation))).then((chunks) => chunks.join('\n'))
  }
}
