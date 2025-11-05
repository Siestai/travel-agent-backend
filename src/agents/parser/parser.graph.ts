import { ChatOllama } from '@langchain/ollama';
import { StateGraph, START, END } from '@langchain/langgraph';
// @ts-ignore - TypeScript can't resolve the export path but it works at runtime
import { HumanMessage } from '@langchain/core/messages';
import { ParserStateSchema, ParserState } from './parser.types';
import { Logger } from '@nestjs/common';

const logger = new Logger('ParserGraph');

// Initialize Ollama ChatModel
const ollamaModel = new ChatOllama({
  baseUrl: 'http://100.101.91.65:11434',
  model: 'llama3.2-vision:11b',
});

/**
 * Process file node - sends file to Ollama and gets response
 * This node accumulates the full response for LangGraph state management
 */
async function processFileNode(
  state: ParserState,
): Promise<Partial<ParserState>> {
  try {
    logger.log(`Processing file: ${state.fileName} (${state.mimeType})`);

    // Convert buffer to base64 for images
    const base64Data = state.fileBuffer.toString('base64');
    const dataUrl = `data:${state.mimeType};base64,${base64Data}`;

    // Create message with image/file content
    // For Ollama vision models, we use the image_url format
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
          text: `Please analyze this ${state.mimeType.startsWith('image/') ? 'image' : 'file'} (${state.fileName}) and provide a detailed description or analysis.`,
        },
      ],
    });

    // Call Ollama - accumulate full response for state
    // Using Runnable interface methods
    const response = await (ollamaModel as any).invoke([message]);

    logger.log(`Received response from Ollama for file: ${state.fileName}`);

    return {
      response: response.content as string,
    };
  } catch (error) {
    logger.error(`Error processing file ${state.fileName}:`, error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Build and compile the LangGraph
 */
export function createParserGraph() {
  const graph = new StateGraph(ParserStateSchema)
    .addNode('processFile', processFileNode)
    .addEdge(START, 'processFile')
    .addEdge('processFile', END);

  return graph.compile();
}

/**
 * Get Ollama model instance for direct streaming
 */
export function getOllamaModel() {
  return ollamaModel;
}
