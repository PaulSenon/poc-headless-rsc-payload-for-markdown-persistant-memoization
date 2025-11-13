import { renderToReadableStream } from '@vitejs/plugin-rsc/rsc';
import { MarkdownRenderer } from '@poc-rsc-payload/components/server';

export type RscPayload = {
  content: React.ReactNode;
};

export default async function handler(request: Request): Promise<Response> {
  // Parse request body for markdown
  const body = (await request.json()) as { markdown?: string };
  const { markdown } = body;
  
  if (!markdown || typeof markdown !== 'string') {
    return new Response('Missing or invalid markdown', { status: 400 });
  }
  
  // Create RSC payload
  const rscPayload: RscPayload = {
    content: <MarkdownRenderer markdown={markdown} />,
  };
  
  // Render to RSC stream
  // Note: Server file paths in stack traces are just metadata for debugging
  // The client uses @vitejs/plugin-rsc/browser to resolve component references
  // Component IDs (like "5d8f14cf3c81") are resolved via the module map, not file paths
  const rscStream = renderToReadableStream<RscPayload>(rscPayload);
  
  return new Response(rscStream, {
    headers: {
      'Content-Type': 'text/x-component;charset=utf-8',
    },
  });
}

