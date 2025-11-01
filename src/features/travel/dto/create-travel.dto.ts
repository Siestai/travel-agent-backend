import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateTravelDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  friends: string[];
}
