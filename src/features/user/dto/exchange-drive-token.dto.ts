import { IsNotEmpty, IsString } from 'class-validator';

export class ExchangeDriveTokenDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  state: string;
}

