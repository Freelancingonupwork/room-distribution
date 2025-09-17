import { describe, expect, it } from 'vitest';

import { RoomAllocator } from '../src/services/RoomAllocator';

describe('RoomAllocator (class)', () => {
  const allocator = new RoomAllocator();

  it('example case', () => {
    const result = allocator.distribute(2, 2, 2, 1);
    expect(result).toEqual([
      { adults: 2, seniors: 0, children: 1 },
      { adults: 0, seniors: 2, children: 0 },
    ]);
  });

  it('rejects when total exceeds capacity', () => {
    expect(allocator.distribute(1, 3, 1, 1)).toEqual([]);
  });

  it('rejects when children would be alone', () => {
    expect(allocator.distribute(1, 0, 0, 2)).toEqual([]);
  });

  it('rejects when a room would be empty', () => {
    expect(allocator.distribute(2, 1, 0, 0)).toEqual([]);
  });
});
