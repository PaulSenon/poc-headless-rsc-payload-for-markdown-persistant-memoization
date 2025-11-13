import { renderToReadableStream  } from '@vitejs/plugin-rsc/rsc';
import { MarkdownRendererHybrid } from '@poc-rsc-payload/components';

export type RscPayload = {
  content: React.ReactNode;
};

// Memory cache: markdown -> buffered RSC payload
const rscCache = new Map<string, Uint8Array>();

// Helper to create ReadableStream from cached Uint8Array
function createStreamFromBuffer(buffer: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(buffer);
      controller.close();
    },
  });
}

// Helper to buffer a ReadableStream to Uint8Array
async function bufferStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  
  // Concatenate all chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

export default async function handler(request: Request): Promise<Response> {
  // Parse request body
  const body = (await request.json()) as { markdown?: string };
  const { markdown } = body;
  
  if (!markdown || typeof markdown !== 'string') {
    return new Response('Missing or invalid markdown', { status: 400 });
  }
  
  // Check cache
  const cached = rscCache.get(markdown);
  if (cached) {
    return new Response(createStreamFromBuffer(cached), {
      headers: {
        'Content-Type': 'text/x-component;charset=utf-8',
      },
    });
  }
  
  // Create RSC payload with MarkdownRenderer (server component with client component inside)
  // MarkdownRenderer uses InteractiveH1 client component for h1 elements
  const rscPayload: RscPayload = {
    content: <MarkdownRendererHybrid markdown={"FROM SERVER\n" + markdown} />,
  };
  
  // Render to RSC stream
  const rscStream = renderToReadableStream<RscPayload>(rscPayload);
  
  // Buffer the stream and cache it
  const buffered = await bufferStream(rscStream);
  rscCache.set(markdown, buffered);
  
  // Return stream from cached buffer
  return new Response(createStreamFromBuffer(buffered), {
    headers: {
      'Content-Type': 'text/x-component;charset=utf-8',
    },
  });
}

