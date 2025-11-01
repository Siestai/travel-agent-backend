export class AppError {
  constructor(options: { code: string; status: number; message: string }) {
    this.code = options.code;
    this.message = options.message;
    this.status = options.status;
  }
  code: string;
  message: string;
  status: number;
  public toString = (): string => {
    return `AppError code=${this.code}, status=${this.status}, message: ${this.message}`;
  };
}
