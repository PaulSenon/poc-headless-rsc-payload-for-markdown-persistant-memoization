import { renderToReadableStream } from '@vitejs/plugin-rsc/rsc';
import { SimpleServerComponent } from '@poc-rsc-payload/components';

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
  
  // Create RSC payload with server-only component (no client components)
  // This tests if basic RSC payload parsing works without module resolution
  const rscPayload: RscPayload = {
    content: <SimpleServerComponent markdown={markdown} />,
  };
  
  // Render to RSC stream
  const rscStream = renderToReadableStream<RscPayload>(rscPayload);
  
  return new Response(rscStream, {
    headers: {
      'Content-Type': 'text/x-component;charset=utf-8',
    },
  });
}

