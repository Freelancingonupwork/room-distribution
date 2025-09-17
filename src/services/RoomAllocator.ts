/**
 * Allocation using a class.
 * Rules:
 * - Each room capacity ≤ 4 and all rooms must be non-empty
 * - Children must always have an adult or senior in the same room
 * - Seniors should be grouped together where possible
 * - Distribute remaining people as evenly as possible
 * - Final sort: adults desc, then seniors desc, then children desc
 *
 */

import { ROOM_CAPACITY } from '../constants/limits';
import { RoomBox } from '../models/RoomBox';
import type { Room } from '../types/Room';

export class RoomAllocator {
  // Allocate people into rooms as per rules.
  distribute(
    roomCount: number,
    totalAdults: number,
    totalSeniors: number,
    totalChildren: number,
  ): Room[] {
    // 1) Feasibility checks
    if (!this.isFeasible(roomCount, totalAdults, totalSeniors, totalChildren)) {
      return [];
    }

    // Local counters that we’ll reduce gradually
    let remainingAdults = totalAdults;
    let remainingSeniors = totalSeniors;
    let remainingChildren = totalChildren;

    // 2) Decide how many senior-only rooms we can keep
    const seniorOnlyCount = this.pickSeniorOnlyRoomCount(
      roomCount,
      remainingAdults,
      remainingSeniors,
      remainingChildren,
    );

    // 3) Create room containers
    const seniorOnlyRooms: RoomBox[] = Array.from({ length: seniorOnlyCount }, () => new RoomBox());
    const mixedRooms: RoomBox[] = Array.from(
      { length: roomCount - seniorOnlyCount },
      () => new RoomBox(),
    );

    // 4) Fill senior-only rooms first (group seniors together)
    for (const room of seniorOnlyRooms) {
      if (remainingSeniors <= 0) break;
      const placed = room.addSeniors(Math.min(ROOM_CAPACITY, remainingSeniors));
      remainingSeniors -= placed;
    }

    // 5) Seed mixed rooms with an anchor (prefer an adult; else a senior)
    for (const room of mixedRooms) {
      if (remainingAdults > 0) {
        room.addAdults(1);
        remainingAdults--;
      } else if (remainingSeniors > 0) {
        room.addSeniors(1);
        remainingSeniors--;
      } else {
        // Should not happen due to feasibility checks
        return [];
      }
    }

    // 6) Place any remaining seniors
    //    First: rooms that already have seniors (keeps them together)
    remainingSeniors = this.placeSeniorsIntoRoomsThatAlreadyHaveSeniors(
      remainingSeniors,
      seniorOnlyRooms,
      mixedRooms,
    );
    //    Then: anywhere with capacity (fallback)
    remainingSeniors = this.placeSeniorsAnywhere(remainingSeniors, seniorOnlyRooms, mixedRooms);

    // 7) Place remaining adults (prefer mixed rooms so senior-only rooms stay mostly seniors)
    remainingAdults = this.placeAdultsPreferMixedRooms(
      remainingAdults,
      mixedRooms,
      seniorOnlyRooms,
    );

    // 8) Place children (never alone)
    //    First: rooms with adults
    remainingChildren = this.placeChildrenIntoRoomsWithAdults(
      remainingChildren,
      mixedRooms,
      seniorOnlyRooms,
    );
    //    Then: rooms with seniors
    if (remainingChildren > 0) {
      remainingChildren = this.placeChildrenIntoRoomsWithSeniors(
        remainingChildren,
        mixedRooms,
        seniorOnlyRooms,
      );
    }

    // Any people left means impossible under constraints
    if (remainingAdults > 0 || remainingSeniors > 0 || remainingChildren > 0) {
      return [];
    }

    // 9) Safety: non-empty & children never alone
    const allRooms = [...mixedRooms, ...seniorOnlyRooms];
    if (allRooms.some((r) => r.total <= 0)) return [];
    if (allRooms.some((r) => r.children > 0 && r.adults + r.seniors === 0)) return [];

    // 10) Convert to plain objects and sort
    const result: Room[] = allRooms
      .map((r) => r.toRoom())
      .sort((a, b) => b.adults - a.adults || b.seniors - a.seniors || b.children - a.children);

    return result;
  }

  // -------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------

  private isFeasible(
    roomCount: number,
    numAdults: number,
    numSeniors: number,
    numChildren: number,
  ): boolean {
    const totalPeople = numAdults + numSeniors + numChildren;

    if (roomCount <= 0) return false;
    if (totalPeople < roomCount) return false; // every room must be non-empty
    if (totalPeople > roomCount * ROOM_CAPACITY) return false; // cannot exceed capacity
    if (numChildren > 0 && numAdults + numSeniors === 0) return false; // children cannot be alone
    return true;
  }

  private ceilDiv(a: number, b: number): number {
    return Math.floor((a + b - 1) / b);
  }

  /**
   * Decide how many senior-only rooms we can keep without making the rest impossible.
   * Rule:
   * - Leave enough rooms to seat all non-seniors.
   * - At most ceil(seniors/4) senior-only rooms.
   * - Ensure we can still anchor each remaining room (adult or senior).
   */
  private pickSeniorOnlyRoomCount(
    roomCount: number,
    numAdults: number,
    numSeniors: number,
    numChildren: number,
  ): number {
    const roomsNeededForNonSeniors = this.ceilDiv(numAdults + numChildren, ROOM_CAPACITY);
    const maxSpareRooms = Math.max(0, roomCount - roomsNeededForNonSeniors);
    let seniorOnlyRooms = Math.min(maxSpareRooms, this.ceilDiv(numSeniors, ROOM_CAPACITY));

    while (seniorOnlyRooms > 0) {
      const seniorsInSeniorRooms = Math.min(numSeniors, seniorOnlyRooms * ROOM_CAPACITY);
      const seniorsLeft = numSeniors - seniorsInSeniorRooms;
      const roomsLeft = roomCount - seniorOnlyRooms;
      // Each remaining room needs at least one non-child anchor
      if (numAdults + seniorsLeft >= roomsLeft) break;
      seniorOnlyRooms--;
    }

    return seniorOnlyRooms;
  }

  // Place seniors into rooms that already have seniors (keeps grouping)
  private placeSeniorsIntoRoomsThatAlreadyHaveSeniors(
    count: number,
    seniorOnlyRooms: RoomBox[],
    mixedRooms: RoomBox[],
  ): number {
    if (count <= 0) return 0;
    let remaining = count;

    // Repeat simple passes until we cannot place more
    while (remaining > 0) {
      let placedSomething = false;

      // senior-only rooms first
      for (const room of seniorOnlyRooms) {
        if (remaining <= 0) break;
        if (room.seniors > 0 && room.remainingCapacity > 0) {
          room.addSeniors(1);
          remaining--;
          placedSomething = true;
        }
      }

      // then mixed rooms that already have seniors
      for (const room of mixedRooms) {
        if (remaining <= 0) break;
        if (room.seniors > 0 && room.remainingCapacity > 0) {
          room.addSeniors(1);
          remaining--;
          placedSomething = true;
        }
      }

      if (!placedSomething) break; // no room could take more seniors this pass
    }

    return remaining;
  }

  // Place seniors anywhere there is capacity (fallback)
  private placeSeniorsAnywhere(
    count: number,
    seniorOnlyRooms: RoomBox[],
    mixedRooms: RoomBox[],
  ): number {
    if (count <= 0) return 0;
    let remaining = count;

    while (remaining > 0) {
      let placedSomething = false;

      for (const room of seniorOnlyRooms) {
        if (remaining <= 0) break;
        if (room.remainingCapacity > 0) {
          room.addSeniors(1);
          remaining--;
          placedSomething = true;
        }
      }

      for (const room of mixedRooms) {
        if (remaining <= 0) break;
        if (room.remainingCapacity > 0) {
          room.addSeniors(1);
          remaining--;
          placedSomething = true;
        }
      }

      if (!placedSomething) break;
    }

    return remaining;
  }

  // Place adults (prefer mixed rooms so senior-only rooms remain mostly seniors)
  private placeAdultsPreferMixedRooms(
    count: number,
    mixedRooms: RoomBox[],
    seniorOnlyRooms: RoomBox[],
  ): number {
    if (count <= 0) return 0;
    let remaining = count;

    // First, try to place into mixed rooms
    while (remaining > 0) {
      let placedSomething = false;

      for (const room of mixedRooms) {
        if (remaining <= 0) break;
        if (room.remainingCapacity > 0) {
          room.addAdults(1);
          remaining--;
          placedSomething = true;
        }
      }

      if (!placedSomething) break;
    }

    // If still left, allow placing into senior-only rooms
    while (remaining > 0) {
      let placedSomething = false;

      for (const room of seniorOnlyRooms) {
        if (remaining <= 0) break;
        if (room.remainingCapacity > 0) {
          room.addAdults(1);
          remaining--;
          placedSomething = true;
        }
      }

      if (!placedSomething) break;
    }

    return remaining;
  }

  // Place children in rooms with adults (never alone)
  private placeChildrenIntoRoomsWithAdults(
    count: number,
    mixedRooms: RoomBox[],
    seniorOnlyRooms: RoomBox[],
  ): number {
    if (count <= 0) return 0;
    let remaining = count;

    while (remaining > 0) {
      let placedSomething = false;

      // prefer mixed rooms with adults
      for (const room of mixedRooms) {
        if (remaining <= 0) break;
        if (room.adults > 0 && room.remainingCapacity > 0) {
          room.addChildren(1);
          remaining--;
          placedSomething = true;
        }
      }

      // then senior-only rooms with adults
      for (const room of seniorOnlyRooms) {
        if (remaining <= 0) break;
        if (room.adults > 0 && room.remainingCapacity > 0) {
          room.addChildren(1);
          remaining--;
          placedSomething = true;
        }
      }

      if (!placedSomething) break; // no more rooms with adults can take children
    }

    return remaining;
  }

  // Place children in rooms with seniors
  private placeChildrenIntoRoomsWithSeniors(
    count: number,
    mixedRooms: RoomBox[],
    seniorOnlyRooms: RoomBox[],
  ): number {
    if (count <= 0) return 0;
    let remaining = count;

    while (remaining > 0) {
      let placedSomething = false;

      // senior-only rooms with seniors
      for (const room of seniorOnlyRooms) {
        if (remaining <= 0) break;
        if (room.seniors > 0 && room.remainingCapacity > 0) {
          room.addChildren(1);
          remaining--;
          placedSomething = true;
        }
      }

      // mixed rooms with seniors
      for (const room of mixedRooms) {
        if (remaining <= 0) break;
        if (room.seniors > 0 && room.remainingCapacity > 0) {
          room.addChildren(1);
          remaining--;
          placedSomething = true;
        }
      }

      if (!placedSomething) break; // cannot place more children
    }

    return remaining;
  }
}
