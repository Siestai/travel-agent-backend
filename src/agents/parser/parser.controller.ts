import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException,
  Logger,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ParserService } from './parser.service';
import { NatsService } from '../../utils/nats/nats.service';
import { ParserEventPayload } from './parser.event.handler';

@Controller('parser')
export class ParserController {
  private readonly logger = new Logger(ParserController.name);

  constructor(
    private readonly parserService: ParserService,
    private readonly natsService: NatsService,
  ) {}

  @Post('process')
  @UseInterceptors(FileInterceptor('file'))
  async processFile(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.logger.log(
      `Received file upload request: ${file.originalname} (${file.mimetype})`,
    );

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    try {
      // Process file and stream response
      for await (const chunk of this.parserService.processFile(file)) {
        // Send chunk as Server-Sent Event
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      // Send completion signal
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      this.logger.error(`Error streaming response:`, error);

      // Send error as SSE
      res.write(
        `data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`,
      );
      res.end();
    }
  }

  @Post('test-event')
  async testEvent(@Body() payload: ParserEventPayload) {
    if (!payload.document_id) {
      throw new BadRequestException('document_id is required');
    }

    const parserSubject = process.env.PARSER_SUBJECT || 'travel.v1.parser.*';
    // Replace * with actual document_id
    const subject = parserSubject.replace('*', payload.document_id);

    this.logger.log(
      `Publishing test parser event: subject=${subject}, payload=${JSON.stringify(payload)}`,
    );

    this.natsService.publishEvent(subject, payload);

    return {
      success: true,
      message: 'Event published successfully',
      subject,
      payload,
    };
  }
}
