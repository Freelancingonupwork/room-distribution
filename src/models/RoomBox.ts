// A helper class to handle adds and capacity checks cleanly.

import { ROOM_CAPACITY } from '../constants/limits';
import type { Room } from '../types/Room';

export class RoomBox implements Room {
  adults = 0;
  seniors = 0;
  children = 0;

  get total(): number {
    return this.adults + this.seniors + this.children;
  }

  get remainingCapacity(): number {
    return ROOM_CAPACITY - this.total;
  }

  addAdults(count: number): number {
    const canAdd = Math.min(count, this.remainingCapacity);
    this.adults += canAdd;
    return canAdd;
  }

  addSeniors(count: number): number {
    const canAdd = Math.min(count, this.remainingCapacity);
    this.seniors += canAdd;
    return canAdd;
  }

  addChildren(count: number): number {
    const canAdd = Math.min(count, this.remainingCapacity);
    this.children += canAdd;
    return canAdd;
  }

  toRoom(): Room {
    return { adults: this.adults, seniors: this.seniors, children: this.children };
  }
}
