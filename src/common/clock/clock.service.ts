import { Injectable } from '@nestjs/common';

/**
 * The only source of "now" in the application. Tests and the admin time-travel
 * endpoint move it by setting an offset; time keeps flowing from the set point.
 */
@Injectable()
export class ClockService {
  private offsetMs = 0;

  now(): Date {
    return new Date(Date.now() + this.offsetMs);
  }

  /** Makes now() return `to` (and keep ticking). */
  set(to: Date): void {
    this.offsetMs = to.getTime() - Date.now();
  }

  reset(): void {
    this.offsetMs = 0;
  }

  isShifted(): boolean {
    return this.offsetMs !== 0;
  }
}
