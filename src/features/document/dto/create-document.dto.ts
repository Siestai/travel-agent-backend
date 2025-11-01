import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  travel_id: string;

  @IsString()
  @IsNotEmpty()
  file_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  url?: string;
}
