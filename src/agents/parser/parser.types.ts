import { z } from 'zod';

export const ParserStateSchema = z.object({
  fileBuffer: z.instanceof(Buffer),
  fileName: z.string(),
  mimeType: z.string(),
  response: z.string().optional(),
  error: z.string().optional(),
});

export type ParserState = z.infer<typeof ParserStateSchema>;
