import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ConnectDriveDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  access_token: string;

  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

