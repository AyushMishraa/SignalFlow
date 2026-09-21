import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { Request, Response } from 'express';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let req: Partial<Request & { correlationId?: string; requestId?: string }>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
    req = {
      header: jest.fn(),
    };
    res = {
      setHeader: jest.fn(),
    };
    next = jest.fn();
  });

  it('should generate new correlationId and requestId when not provided in header', () => {
    (req.header as jest.Mock).mockReturnValue(undefined);

    middleware.use(req as any, res as any, next);

    expect(req.correlationId).toBeDefined();
    expect(req.requestId).toBeDefined();
    expect(typeof req.correlationId).toBe('string');
    expect(typeof req.requestId).toBe('string');

    expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', req.correlationId);
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.requestId);
    expect(next).toHaveBeenCalled();
  });

  it('should reuse incoming x-correlation-id header', () => {
    const existingCorrelationId = 'test-corr-id-12345';
    (req.header as jest.Mock).mockReturnValue(existingCorrelationId);

    middleware.use(req as any, res as any, next);

    expect(req.correlationId).toBe(existingCorrelationId);
    expect(req.requestId).toBeDefined();
    expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', existingCorrelationId);
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.requestId);
    expect(next).toHaveBeenCalled();
  });
});

