import { IsEmail, IsNotEmpty } from 'class-validator';

export class DisconnectDriveDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
