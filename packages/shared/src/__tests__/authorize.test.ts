import { authorize } from '../middleware/authorize';
import { ForbiddenError, UnauthorizedError } from '../errors';

function makeReq(user?: { id: string; email: string; role: any }): any {
  return { user };
}

describe('authorize middleware', () => {
  it('returns a middleware function', () => {
    const mw = authorize('ADMIN');
    expect(typeof mw).toBe('function');
  });

  it('calls next() when the user role is allowed', () => {
    const next = jest.fn();
    const mw = authorize('ADMIN', 'INSPECTOR');
    const req = makeReq({ id: '1', email: 'a@b.com', role: 'INSPECTOR' });

    mw(req, {} as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('throws ForbiddenError when the user role is not allowed', () => {
    const next = jest.fn();
    const mw = authorize('ADMIN');
    const req = makeReq({ id: '1', email: 'a@b.com', role: 'USER' });

    expect(() => mw(req, {} as any, next)).toThrow(ForbiddenError);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when req.user is undefined', () => {
    const next = jest.fn();
    const mw = authorize('ADMIN');
    const req = makeReq(undefined);

    expect(() => mw(req, {} as any, next)).toThrow(UnauthorizedError);
    expect(next).not.toHaveBeenCalled();
  });
});
