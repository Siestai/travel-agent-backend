import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { NatsJetStreamContext } from '@nestjs-plugins/nestjs-nats-jetstream-transport';
import { ParserService } from './parser.service';

export interface ParserEventPayload {
  document_id: string;
  travel_id: string;
}

@Controller()
export class ParserEventHandler {
  private readonly logger = new Logger(ParserEventHandler.name);

  private static readonly REDELIVERY_COUNT_THRESHOLD = 10;
  private static readonly RETRY_AFTER_MILISECONDS = 10_000;

  constructor(private readonly parserService: ParserService) {}

  @EventPattern(process.env.PARSER_SUBJECT || 'travel.v1.parser.*')
  async handleParserEvent(
    @Payload() payload: ParserEventPayload,
    @Ctx() ctx: NatsJetStreamContext,
  ) {
    const redeliveryCount = ctx.message.info.deliveryCount;
    const subject = ctx.message.subject;

    this.logger.debug(
      `[${ctx.message.info.streamSequence}][n°: ${redeliveryCount}] Received parser event: document_id=${payload.document_id}, subject=${subject}`,
    );

    if (redeliveryCount > ParserEventHandler.REDELIVERY_COUNT_THRESHOLD) {
      this.logger.warn(
        `[${ctx.message.info.streamSequence}] Tried ${ParserEventHandler.REDELIVERY_COUNT_THRESHOLD} times to process parser event but failed, terminating...`,
      );
      ctx.message.term();
      return;
    }

    try {
      // Extract document_id from subject pattern: travel.v1.parser.{document_id}
      const subjectParts = subject.split('.');
      const documentIdFromSubject = subjectParts[subjectParts.length - 1];

      if (documentIdFromSubject !== payload.document_id) {
        this.logger.warn(
          `Document ID mismatch: subject=${documentIdFromSubject}, payload=${payload.document_id}`,
        );
      }

      this.logger.log(
        `[${ctx.message.info.streamSequence}] Processing parser event for document: ${payload.document_id}`,
      );

      // TODO: Implement actual parsing logic here
      // For now, just log the event
      this.logger.log(
        `[${ctx.message.info.streamSequence}] Parser event processed successfully for document: ${payload.document_id}`,
      );

      ctx.message.ack();
    } catch (error) {
      this.logger.error(
        `[${ctx.message.info.streamSequence}] Failed to process parser event: ${error}, retrying...`,
      );
      this.logger.debug(
        `[${ctx.message.info.streamSequence}] Retrying in ${ParserEventHandler.RETRY_AFTER_MILISECONDS / 1000} seconds...`,
      );
      ctx.message.nak(ParserEventHandler.RETRY_AFTER_MILISECONDS);
    }
  }
}
