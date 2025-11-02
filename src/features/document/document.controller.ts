import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentDto } from './dto/document.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentService.create(createDocumentDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.documentService.delete(id);
  }

  @Get('travel/:travelId')
  async findAllByTravelId(
    @Param('travelId') travelId: string,
  ): Promise<DocumentDto[]> {
    const documents = await this.documentService.findAllByTravelId(travelId);
    return documents.map((doc) => DocumentDto.fromEntity(doc));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DocumentDto> {
    const document = await this.documentService.findOne(id);
    return DocumentDto.fromEntity(document);
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('email') email: string,
    @Body('travel_id') travelId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const documents = await Promise.all(
      files.map((file) =>
        this.documentService.uploadFile(email, travelId, file),
      ),
    );

    return documents.map((doc) => DocumentDto.fromEntity(doc));
  }
}
