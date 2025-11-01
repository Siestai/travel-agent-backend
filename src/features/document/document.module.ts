import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from './entity/document.entity';

import { Module } from '@nestjs/common';
@Module({
  controllers: [DocumentController],
  providers: [DocumentService],
  imports: [TypeOrmModule.forFeature([DocumentEntity])],
})
export class DocumentModule {}
