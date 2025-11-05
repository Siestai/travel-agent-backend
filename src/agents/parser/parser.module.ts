import { Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { ParserEventHandler } from './parser.event.handler';
import { NatsModule } from '../../utils/nats/nats.module';

@Module({
  imports: [NatsModule],
  controllers: [ParserController, ParserEventHandler],
  providers: [ParserService],
  exports: [ParserService],
})
export class ParserModule {}
