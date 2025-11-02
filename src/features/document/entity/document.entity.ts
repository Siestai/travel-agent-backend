import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TravelEntity } from '../../travel/entity/travel.entity';
import { DocumentType } from '../type/document.type';

@Entity('document')
@Index('IDX_Document_UserId_TravelId', ['user_id', 'travel_id'])
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  user_id: string;

  @Column()
  travel_id: string;

  @ManyToOne(() => TravelEntity, (travel) => travel.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'travel_id', referencedColumnName: 'id' })
  travel: TravelEntity;

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
