import { Money } from 'src/common/money';

export enum LocationKind {
  Accommodation = 'ACCOMMODATION',
  Activity = 'ACTIVITY',
  Transportation = 'TRANSPORTATION',
}

export enum LocationType {
  Airport = 'AIRPORT',
  Station = 'STATION',
  Food = 'FOOD',
  Event = 'EVENT',
  Historical = 'HISTORICAL',
  Other = 'OTHER',
}

export enum ConnectionBy {
  Flight = 'FLIGHT',
  Train = 'TRAIN',
  Tram = 'TRAM',
  Bus = 'BUS',
  Ferry = 'FERRY',
  Cruise = 'CRUISE',
  Car = 'CAR',
  Motorcycle = 'MOTORCYCLE',
  Boat = 'BOAT',
  Helicopter = 'HELICOPTER',
  Other = 'OTHER',
}

export enum ConnectionPoint {
  Start = 'START',
  End = 'END',
}

export interface IConnection {
  by: ConnectionBy;
  linked_location_id: string;
  point: ConnectionPoint;
  price?: Money;
}

export interface ICoordinates {
  latitude: number;
  longitude: number;
}
