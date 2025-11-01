import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('document')
@Index(['IDX_UserId_TravelId', 'user_id', 'travel_id'])
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  user_id: string;

  @Column()
  travel_id: string;

  @Column()
  file_id: string;

  @Column()
  name: string;

  @Column()
  type: DocumentType;

  @Column({ nullable: true })
  url: string;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
