import { DocumentEntity } from '../entity/document.entity';

export class DocumentDto {
  static fromEntity(entity: DocumentEntity): DocumentDto {
    const dto = new DocumentDto();
    dto.id = entity.id;
    dto.user_id = entity.user_id;
    dto.travel_id = entity.travel_id;
    dto.file_id = entity.file_id;
    dto.name = entity.name;
    dto.url = entity.url;
    dto.drive_folder_id = entity.drive_folder_id;
    dto.created = entity.created;
    dto.updated = entity.updated;
    return dto;
  }

  id: string;
  user_id: string;
  travel_id: string;
  file_id: string;
  name: string;
  url: string | null;
  drive_folder_id: string | null;
  created: Date;
  updated: Date;
}
