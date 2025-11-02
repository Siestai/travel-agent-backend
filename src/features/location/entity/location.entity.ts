import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ConnectionBy,
  IConnection,
  ICoordinates,
  LocationKind,
  LocationType,
} from '../type/location.type';
import { Money } from 'src/common/money';

@Entity('location')
@Index(['IDX_UserId_TravelId', 'user_id', 'travel_id'])
@Index(['IDX_UserId_TravelId_Kind', 'user_id', 'travel_id', 'kind'])
@Index(['IDX_UserId_TravelId_Type', 'user_id', 'travel_id', 'type'])
export class LocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  travel_id: string;

  @Column()
  name: string;

  @Column()
  kind: LocationKind;

  @Column()
  type: LocationType;

  @Column({ nullable: true })
  connection?: IConnection;

  @Column({ type: 'jsonb', default: {} })
  coordinates: ICoordinates;

  @Column({ nullable: true })
  document_id?: string;

  @Column({ type: 'jsonb', nullable: true })
  price?: Money;

  @Column({ nullable: true })
  start_date?: Date;

  @Column({ nullable: true })
  end_date?: Date;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
