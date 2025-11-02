import { TravelEntity } from '../entity/travel.entity';

export class TravelDto {
  static fromEntity(entity: TravelEntity): TravelDto {
    const dto = new TravelDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.friends = entity.friends;
    dto.drive_folder_id = entity.drive_folder_id;
    dto.start_date = entity.start_date;
    dto.end_date = entity.end_date;
    dto.created = entity.created;
    dto.updated = entity.updated;

    // Include documents if loaded
    if (entity.documents.length) {
      dto.documents = entity.documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        url: doc.url,
      }));
    }

    return dto;
  }

  id: string;
  name: string;
  friends: string[];
  drive_folder_id: string;
  start_date: Date;
  end_date: Date;
  created: Date;
  updated: Date;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    url: string | null;
  }>;
}
