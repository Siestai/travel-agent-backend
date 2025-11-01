import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentEntity } from '../../document/entity/document.entity';

@Entity('travel')
export class TravelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  user_id: string;

  @Column()
  name: string;

  @Column('jsonb', { default: [] })
  friends: string[];

  @OneToMany(() => DocumentEntity, (document) => document.travel, {
    cascade: true,
  })
  documents: DocumentEntity[];

  @Column({ nullable: true })
  start_date: Date;

  @Column({ nullable: true })
  end_date: Date;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
