export enum AppErrorCodes {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
}

export const AppErrorType: Record<string, { code: string; status: number }> = {
  [AppErrorCodes.INTERNAL_SERVER_ERROR]: {
    code: AppErrorCodes.INTERNAL_SERVER_ERROR,
    status: 500,
  },
  [AppErrorCodes.NOT_FOUND]: {
    code: AppErrorCodes.NOT_FOUND,
    status: 404,
  },
  [AppErrorCodes.BAD_REQUEST]: {
    code: AppErrorCodes.BAD_REQUEST,
    status: 400,
  },
};
