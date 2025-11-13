# Headless RSC Architecture Implementation

## Architecture Overview

**Three-Tier Decoupled System:**

1. **`/packages/components`** - Shared React components package

   - Markdown renderer component
   - Interactive demo component (H1 with counter button)
   - Server and client components
   - No dependencies on apps

2. **`/apps/rsc-server`** - Hono service for RSC payload generation

   - Standalone service, unaware of client
   - POST endpoint: `/render` accepts markdown, returns RSC payload
   - Uses shared components package
   - Can be called from anywhere (async, cron, etc.)

3. **`/apps/demo-rsc-client`** - Vite + TanStack Router CSR app

   - Consumes RSC payloads (not directly from server)
   - Side-by-side comparison: CSR vs RSC rendering
   - Uses shared components package for CSR rendering
   - Fetches RSC payloads from API/storage

**Communication Flow:**

```
Client → POST /render (markdown) → RSC Server → RSC Payload → Storage/Response
Client → GET /rsc/:hash → Storage → RSC Payload → Client renders
```

## Implementation Plan

### Phase 1: Shared Components Package

**Files to create:**

- `packages/components/package.json`
- `packages/components/tsconfig.json`
- `packages/components/src/markdown-renderer.tsx` - Server component
- `packages/components/src/markdown-renderer.client.tsx` - Client component wrapper
- `packages/components/src/interactive-h1.tsx` - Client component (counter button)
- `packages/components/src/index.ts` - Exports

**Markdown Renderer (Server Component):**

```typescript
// packages/components/src/markdown-renderer.tsx
// Server component - no "use client"
import ReactMarkdown from 'react-markdown';
import { InteractiveH1 } from './interactive-h1';

export function MarkdownRenderer({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <InteractiveH1>{children}</InteractiveH1>,
        // ... other component mappings
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
```

**Interactive H1 (Client Component):**

```typescript
// packages/components/src/interactive-h1.tsx
"use client";

import { useState } from 'react';

export function InteractiveH1({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  
  return (
    <div className="flex items-center gap-2">
      <h1>{children}</h1>
      <button
        onClick={() => setCount(c => c + 1)}
        className="px-2 py-1 bg-blue-500 text-white rounded"
      >
        Count: {count}
      </button>
    </div>
  );
}
```

**Package Config:**

```json
{
  "name": "@ai-monorepo/components",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./server": "./src/markdown-renderer.tsx",
    "./client": "./src/markdown-renderer.client.tsx"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-markdown": "^10.1.0"
  }
}
```

### Phase 2: RSC Server (Hono)

**Files to create:**

- `apps/rsc-server/package.json`
- `apps/rsc-server/tsconfig.json`
- `apps/rsc-server/vite.config.ts` - RSC environment config
- `apps/rsc-server/src/entry.rsc.tsx` - RSC entry point
- `apps/rsc-server/src/server.ts` - Hono server
- `apps/rsc-server/src/routes/render.ts` - Render endpoint

**Vite Config:**

```typescript
// apps/rsc-server/vite.config.ts
import { defineConfig } from 'vite';
import rsc from '@vitejs/plugin-rsc';

export default defineConfig({
  plugins: [
    rsc({
      entries: {
        rsc: './src/entry.rsc.tsx',
      },
      serverHandler: false, // We handle server ourselves with Hono
    }),
  ],
  environments: {
    rsc: {
      build: {
        rollupOptions: {
          input: {
            index: './src/entry.rsc.tsx',
          },
        },
        outDir: './dist/rsc',
      },
    },
  },
});
```

**RSC Entry Point:**

```typescript
// apps/rsc-server/src/entry.rsc.tsx
import { renderToReadableStream } from '@vitejs/plugin-rsc/rsc';
import { MarkdownRenderer } from '@ai-monorepo/components/server';

export type RscPayload = {
  content: React.ReactNode;
};

export default async function handler(request: Request): Promise<Response> {
  // Parse request body for markdown
  const body = await request.json();
  const { markdown } = body;
  
  if (!markdown || typeof markdown !== 'string') {
    return new Response('Missing or invalid markdown', { status: 400 });
  }
  
  // Create RSC payload
  const rscPayload: RscPayload = {
    content: <MarkdownRenderer markdown={markdown} />,
  };
  
  // Render to RSC stream
  const rscStream = renderToReadableStream<RscPayload>(rscPayload);
  
  return new Response(rscStream, {
    headers: {
      'Content-Type': 'text/x-component;charset=utf-8',
    },
  });
}
```

**Hono Server:**

```typescript
// apps/rsc-server/src/server.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import renderHandler from './entry.rsc';

const app = new Hono();

app.use('/*', cors());

// POST /render - accepts { markdown: string }, returns RSC payload
app.post('/render', async (c) => {
  try {
    const response = await renderHandler(c.req.raw);
    return response;
  } catch (error) {
    console.error('RSC render error:', error);
    return c.json({ error: 'RSC render failed' }, 500);
  }
});

export default app;
```

**Server Entry:**

```typescript
// apps/rsc-server/src/index.ts
import app from './server';

const port = process.env.PORT || 3002;

export default {
  port,
  fetch: app.fetch,
};
```

### Phase 3: Demo RSC Client

**Files to create:**

- `apps/demo-rsc-client/package.json`
- `apps/demo-rsc-client/vite.config.ts`
- `apps/demo-rsc-client/tsconfig.json`
- `apps/demo-rsc-client/src/main.tsx` - Client entry
- `apps/demo-rsc-client/src/routes/__root.tsx` - Root layout
- `apps/demo-rsc-client/src/routes/index.tsx` - Demo page
- `apps/demo-rsc-client/src/components/csr-markdown.tsx` - CSR renderer
- `apps/demo-rsc-client/src/components/rsc-markdown.tsx` - RSC payload renderer
- `apps/demo-rsc-client/src/lib/rsc-client.ts` - RSC client utilities

**Vite Config:**

```typescript
// apps/demo-rsc-client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
  ],
  // No RSC plugin needed - we only consume RSC payloads
});
```

**RSC Client Utilities:**

```typescript
// apps/demo-rsc-client/src/lib/rsc-client.ts
import { createFromReadableStream, createFromFetch } from '@vitejs/plugin-rsc/browser';

export type RscPayload = {
  content: React.ReactNode;
};

const RSC_SERVER_URL = import.meta.env.VITE_RSC_SERVER_URL || 'http://localhost:3002';

// Fetch RSC payload from server
export async function fetchRscPayload(markdown: string): Promise<Promise<RscPayload>> {
  const response = await fetch(`${RSC_SERVER_URL}/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/x-component',
    },
    body: JSON.stringify({ markdown }),
  });
  
  if (!response.ok) {
    throw new Error(`RSC fetch failed: ${response.statusText}`);
  }
  
  return createFromFetch<RscPayload>(Promise.resolve(response));
}

// Convert blob to ReadableStream for cached payloads
export function blobToStream(blob: Blob): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      const buffer = await blob.arrayBuffer();
      controller.enqueue(new Uint8Array(buffer));
      controller.close();
    },
  });
}

// Load RSC payload from cached blob
export function loadRscFromBlob(blob: Blob): Promise<RscPayload> {
  const stream = blobToStream(blob);
  return createFromReadableStream<RscPayload>(stream);
}
```

**CSR Markdown Component:**

```typescript
// apps/demo-rsc-client/src/components/csr-markdown.tsx
"use client";

import { MarkdownRenderer } from '@ai-monorepo/components/client';

export function CsrMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="border rounded p-4">
      <h2 className="text-sm font-mono mb-2">CSR Rendered</h2>
      <MarkdownRenderer markdown={markdown} />
    </div>
  );
}
```

**RSC Payload Component:**

```typescript
// apps/demo-rsc-client/src/components/rsc-markdown.tsx
"use client";

import { use, useState, useEffect } from 'react';
import { fetchRscPayload, type RscPayload } from '@/lib/rsc-client';

export function RscMarkdown({ markdown }: { markdown: string }) {
  const [rscPromise, setRscPromise] = useState<Promise<RscPayload> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    fetchRscPayload(markdown)
      .then((promise) => {
        setRscPromise(promise);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [markdown]);
  
  if (isLoading) {
    return (
      <div className="border rounded p-4">
        <h2 className="text-sm font-mono mb-2">RSC Rendered (Loading...)</h2>
        <div>Loading RSC payload...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="border rounded p-4">
        <h2 className="text-sm font-mono mb-2">RSC Rendered (Error)</h2>
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }
  
  if (!rscPromise) return null;
  
  // React 19 use() hook unwraps the promise
  const payload = use(rscPromise);
  
  return (
    <div className="border rounded p-4">
      <h2 className="text-sm font-mono mb-2">RSC Rendered</h2>
      {payload.content}
    </div>
  );
}
```

**Demo Page:**

```typescript
// apps/demo-rsc-client/src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { CsrMarkdown } from '@/components/csr-markdown';
import { RscMarkdown } from '@/components/rsc-markdown';

const markdownExamples = [
  `# Example 1\n\nThis is a **bold** example with an interactive H1.`,
  `# Example 2\n\nThis has *italic* text and another interactive H1.`,
  `# Example 3\n\nThis is a third example with \`code\` and an interactive H1.`,
];

export const Route = createFileRoute('/')({
  component: DemoPage,
});

function DemoPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">RSC vs CSR Comparison</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column: CSR Rendered */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Client-Side Rendered</h2>
          <div className="space-y-4">
            {markdownExamples.map((md, i) => (
              <CsrMarkdown key={i} markdown={md} />
            ))}
          </div>
        </div>
        
        {/* Right Column: RSC Rendered */}
        <div>
          <h2 className="text-xl font-semibold mb-4">RSC Payload Rendered</h2>
          <div className="space-y-4">
            {markdownExamples.map((md, i) => (
              <RscMarkdown key={i} markdown={md} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Root Layout:**

```typescript
// apps/demo-rsc-client/src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>RSC Demo Client</title>
      </head>
      <body>
        <Outlet />
      </body>
    </html>
  );
}
```

**Client Entry:**

```typescript
// apps/demo-rsc-client/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import './index.css';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

### Phase 4: Package Dependencies

**Shared Components (`packages/components/package.json`):**

```json
{
  "name": "@ai-monorepo/components",
  "version": "0.0.0",
  "type": "module",
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-markdown": "^10.1.0"
  },
  "peerDependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  }
}
```

**RSC Server (`apps/rsc-server/package.json`):**

```json
{
  "name": "@ai-monorepo/rsc-server",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@ai-monorepo/components": "workspace:*",
    "hono": "^4.0.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-rsc": "^0.4.10",
    "vite": "^6.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Demo Client (`apps/demo-rsc-client/package.json`):**

```json
{
  "name": "@ai-monorepo/demo-rsc-client",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 3003",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ai-monorepo/components": "workspace:*",
    "@tanstack/react-router": "^1.134.4",
    "@tanstack/router-plugin": "^1.114.27",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-rsc": "^0.4.10",
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Phase 5: Build Configuration

**RSC Server Build:**

- Builds RSC environment bundle to `dist/rsc/index.js`
- Exports default handler function
- Hono server imports and uses handler

**Demo Client Build:**

- Standard Vite CSR build
- No RSC build needed (only consumes payloads)
- Uses `@vitejs/plugin-rsc/browser` for client-side RSC consumption

### Phase 6: Development Workflow

**Start RSC Server:**

```bash
cd apps/rsc-server
pnpm dev  # Runs on port 3002
```

**Start Demo Client:**

```bash
cd apps/demo-rsc-client
VITE_RSC_SERVER_URL=http://localhost:3002 pnpm dev  # Runs on port 3003
```

**Test Flow:**

1. Open demo client at `http://localhost:3003`
2. Left column shows CSR rendered markdown (using shared component directly)
3. Right column shows RSC payload rendered markdown (fetched from RSC server)
4. Both should render identically, including interactive H1 counter buttons
5. Interactive components should work in both (CSR native, RSC hydrated)

## Key Implementation Details

**Module Map Handling:**

- `@vitejs/plugin-rsc` automatically generates module map for RSC server
- Client uses `@vitejs/plugin-rsc/browser` which handles module resolution
- No manual module map configuration needed

**RSC Payload Format:**

- Server returns `text/x-component` stream
- Client uses `createFromFetch` or `createFromReadableStream` to deserialize
- React 19 `use()` hook unwraps promise to React element tree

**Component Boundaries:**

- Server components in `packages/components/src/markdown-renderer.tsx`
- Client components marked with `"use client"` (InteractiveH1)
- Client wrapper in `packages/components/src/markdown-renderer.client.tsx` for CSR usage

**Decoupling:**

- RSC server has no knowledge of client app
- Client app has no knowledge of RSC server internals
- Only shared dependency is `@ai-monorepo/components`
- Communication via HTTP POST/GET only

## Testing Checklist

1. ✅ RSC server starts and responds to POST /render
2. ✅ RSC payload is valid `text/x-component` stream
3. ✅ Demo client fetches and renders RSC payloads
4. ✅ CSR and RSC renderings match visually
5. ✅ Interactive components work in both (counter buttons)
6. ✅ No direct dependencies between apps
7. ✅ Shared components package works in both contexts

## Future Enhancements (Out of Scope)

- Caching layer (IndexedDB, filesystem, database)
- Batch rendering endpoint
- Payload compression
- Error boundaries for RSC rendering
- Streaming support for large payloads