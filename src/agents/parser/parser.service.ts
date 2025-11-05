import { Injectable, Logger } from '@nestjs/common';
// @ts-ignore - TypeScript can't resolve the export path but it works at runtime
import { HumanMessage } from '@langchain/core/messages';
import { getOllamaModel } from './parser.graph';
import { AppError } from '../../utils/error/app-error';
import { AppErrorCodes, AppErrorType } from '../../common/error-codes';

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);
  private readonly ollamaModel = getOllamaModel();

  /**
   * Process a file and stream the response from Ollama
   * Uses LangGraph pattern but streams directly from Ollama for real-time chunks
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
      // Convert buffer to base64 for images
      const base64Data = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype || 'application/octet-stream'};base64,${base64Data}`;

      // Create message with image/file content
      const message = new HumanMessage({
        content: [
          {
            type: 'image_url',
            image_url: {
              url: dataUrl,
            },
          },
          {
            type: 'text',
            text: `Please analyze this ${file.mimetype?.startsWith('image/') ? 'image' : 'file'} (${file.originalname}) and provide a detailed description or analysis.`,
          },
        ],
      });

      // Stream response directly from Ollama
      // Using Runnable interface methods
      const stream = await (this.ollamaModel as any).stream([message]);

      // Yield chunks as they come from Ollama
      for await (const chunk of stream) {
        const content = chunk.content;
        if (content && typeof content === 'string') {
          yield content;
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
