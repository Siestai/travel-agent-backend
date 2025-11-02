import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { randomBytes } from 'crypto';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string | null;

  @Column({ nullable: true })
  surname: string | null;

  @Column({ unique: true })
  referral_code: string;

  @Column({ default: false })
  drive_connected: boolean;

  @Column({ nullable: true })
  drive_access_token?: string;

  @Column({ nullable: true })
  drive_refresh_token?: string;

  @Column({ nullable: true })
  drive_root_folder_id?: string;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @BeforeInsert()
  generateReferralCode() {
    if (!this.referral_code) {
      // Generate a random 10-character alphanumeric code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      const randomBytesArray = randomBytes(10);
      for (let i = 0; i < 10; i++) {
        code += chars[randomBytesArray[i] % chars.length];
      }
      this.referral_code = code;
    }
  }
}
