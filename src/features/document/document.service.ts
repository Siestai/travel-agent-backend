import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from './entity/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentType } from './type/document.type';
import { TravelEntity } from '../travel/entity/travel.entity';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto) {
    const document = this.documentRepository.create({
      user_id: createDocumentDto.user_id,
      travel: { id: createDocumentDto.travel_id } as Partial<TravelEntity>,
      file_id: createDocumentDto.file_id,
      name: createDocumentDto.name,
      type: createDocumentDto.type as DocumentType,
      url: createDocumentDto.url,
    });
    return this.documentRepository.save(document);
  }

  async delete(id: string) {
    return this.documentRepository.delete({ id });
  }
}
