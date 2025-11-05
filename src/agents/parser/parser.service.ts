import { Injectable, Logger } from '@nestjs/common';
import { createParserGraph } from './parser.graph';
import { AppError } from '../../utils/error/app-error';
import { AppErrorCodes, AppErrorType } from '../../common/error-codes';
// @ts-expect-error - TypeScript can't resolve the export path but it works at runtime
import { AIMessageChunk } from '@langchain/core/messages';

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);
  private readonly graph = createParserGraph();

  /**
   * Process a file and stream the response through LangGraph
   * Uses LangGraph's stream() method with streamMode="messages" to stream LLM tokens
   */
  async *processFile(
    file: Express.Multer.File,
  ): AsyncGenerator<string, void, unknown> {
    if (!file) {
      throw new AppError({
        message: 'No file provided',
        ...AppErrorType[AppErrorCodes.BAD_REQUEST],
      });
    }

    this.logger.log(
      `Processing file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`,
    );

    try {
      // Prepare initial state for LangGraph
      const initialState = {
        fileBuffer: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype || 'application/octet-stream',
      };

      // Stream from LangGraph using "messages" mode to get LLM tokens
      // This streams the agentic flow and captures LLM token streams automatically
      // streamMode can be: "values", "updates", "messages", "custom", or "debug"
      const stream = await this.graph.stream(initialState, {
        streamMode: 'messages',
      });

      // Yield chunks from the streamed messages
      // LangGraph with stream_mode="messages" yields tuples of (chunk, metadata)
      // where chunk is an AIMessageChunk containing token content
      for await (const chunk of stream) {
        try {
          // Handle tuple format: [chunk, metadata]
          let messageChunk: AIMessageChunk | null = null;

          if (Array.isArray(chunk) && chunk.length === 2) {
            // Format: [chunk, metadata] tuple
            messageChunk = chunk[0] as AIMessageChunk;
          } else if (chunk && typeof chunk === 'object' && 'content' in chunk) {
            // Format: direct AIMessageChunk object
            messageChunk = chunk as AIMessageChunk;
          }

          // Extract content from the message chunk
          if (messageChunk?.content) {
            const content = messageChunk.content;
            // Content can be string or array of content blocks
            if (typeof content === 'string') {
              yield content;
            } else if (Array.isArray(content)) {
              // Handle array of content blocks (e.g., text blocks)
              for (const block of content) {
                if (typeof block === 'string') {
                  yield block;
                } else if (
                  block &&
                  typeof block === 'object' &&
                  'text' in block
                ) {
                  yield block.text;
                }
              }
            }
          }
        } catch (chunkError) {
          this.logger.warn(
            `Error processing chunk for ${file.originalname}:`,
            chunkError,
          );
          // Continue processing other chunks
        }
      }

      this.logger.log(`Finished streaming response for: ${file.originalname}`);
    } catch (error) {
      this.logger.error(
        `Error in processFile for ${file.originalname}:`,
        error,
      );

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError({
        message:
          error instanceof Error
            ? `Failed to process file: ${error.message}`
            : 'Failed to process file',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
  }
}
