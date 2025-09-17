import { RoomAllocator } from './services/RoomAllocator';

const roomAllocator = new RoomAllocator();

const numberOfRooms = 2;
const numberOfAdults = 2;
const numberOfSeniors = 2;
const numberOfChildren = 1;

const allocation = roomAllocator.distribute(
  numberOfRooms,
  numberOfAdults,
  numberOfSeniors,
  numberOfChildren,
);

console.log(allocation);
// Example valid sorted result:
// [ { adults: 2, seniors: 0, children: 1 }, { adults: 0, seniors: 2, children: 0 } ]
