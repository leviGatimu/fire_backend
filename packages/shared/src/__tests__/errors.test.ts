import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../errors';

describe('AppError subclasses', () => {
  const cases: Array<[new (...a: any[]) => AppError, number, string]> = [
    [BadRequestError, 400, 'BAD_REQUEST'],
    [UnauthorizedError, 401, 'UNAUTHORIZED'],
    [ForbiddenError, 403, 'FORBIDDEN'],
    [NotFoundError, 404, 'NOT_FOUND'],
    [ConflictError, 409, 'CONFLICT'],
    [ValidationError, 422, 'VALIDATION_ERROR'],
  ];

  it.each(cases)('%p sets the right statusCode and code', (Ctor, statusCode, code) => {
    const err = new Ctor();
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(statusCode);
    expect(err.code).toBe(code);
    expect(err.isOperational).toBe(true);
  });

  it('preserves custom messages and details', () => {
    const err = new ValidationError('bad input', { field: 'email' });
    expect(err.message).toBe('bad input');
    expect(err.details).toEqual({ field: 'email' });
  });
});
