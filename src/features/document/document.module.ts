import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from './entity/document.entity';
import { UserModule } from '../user/user.module';
import { TravelModule } from '../travel/travel.module';

import { Module } from '@nestjs/common';
@Module({
  controllers: [DocumentController],
  providers: [DocumentService],
  imports: [
    TypeOrmModule.forFeature([DocumentEntity]),
    UserModule,
    TravelModule,
  ],
})
export class DocumentModule {}
