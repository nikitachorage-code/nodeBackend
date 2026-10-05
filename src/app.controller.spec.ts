import { AppController } from './app.controller.js';
import type { AppService } from './app.service.js';

describe('AppController', () => {
  it('returns health from the service', async () => {
    const health = { status: 'ok', database: 'up', timestamp: 'now' };
    const service = { getHealth: vi.fn().mockResolvedValue(health) };
    const controller = new AppController(service as unknown as AppService);

    await expect(controller.getHealth()).resolves.toEqual(health);
  });
});
