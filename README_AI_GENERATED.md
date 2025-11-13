# RSC Payload PoC - Technical Documentation

A proof-of-concept demonstrating **headless React Server Components (RSC)** rendering using `@vitejs/plugin-rsc` in a monorepo setup. This project shows how to decouple RSC server rendering from client consumption, enabling static RSC payload generation and client-side hydration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Monorepo Structure                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  packages/components/                                       │
│  ├── Server Components (MarkdownRenderer, etc.)             │
│  └── Client Components (InteractiveH1, ClientCounter)       │
│                                                              │
│  apps/server/ (RSC Server)                                   │
│  ├── Renders RSC payloads using @vitejs/plugin-rsc         │
│  └── Exposes /render and /render-mixed endpoints            │
│                                                              │
│  apps/web/ (RSC Client)                                      │
│  ├── Consumes RSC payloads via fetch                        │
│  ├── Parses using @vitejs/plugin-rsc/browser                │
│  └── Renders with React 19's use() hook                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## How It Works

### 1. RSC Server (`apps/server`)

The server uses `@vitejs/plugin-rsc` to render React Server Components into RSC payloads (Flight format).

#### Build Process

```typescript
// apps/server/vite.config.ts
rsc({
  serverHandler: false, // We handle server ourselves with Hono
})
```

The plugin builds two entry points:
- `src/entry.rsc.tsx` → `dist/rsc/index.js` (server-only components)
- `src/entry-mixed.rsc.tsx` → `dist/rsc/mixed.js` (mixed server + client)

#### RSC Rendering

```typescript
// apps/server/src/entry-mixed.rsc.tsx
import { renderToReadableStream } from '@vitejs/plugin-rsc/rsc';
import { MarkdownRenderer } from '@poc-rsc-payload/components';

export default async function handler(request: Request): Promise<Response> {
  const { markdown } = await request.json();
  
  // Create RSC payload
  const rscPayload = {
    content: <MarkdownRenderer markdown={markdown} />,
  };
  
  // Render to RSC stream (Flight format)
  const rscStream = renderToReadableStream<RscPayload>(rscPayload);
  
  return new Response(rscStream, {
    headers: {
      'Content-Type': 'text/x-component;charset=utf-8',
    },
  });
}
```

**Key Points:**
- `renderToReadableStream` serializes React components into the RSC Flight format
- Client components are referenced by ID (e.g., `"5d8f14cf3c81"` for `InteractiveH1`)
- The payload is a stream of JSON-like instructions that describe the component tree

#### Component ID Generation

The plugin generates stable IDs for client components:
- **Development**: Based on file path hash (`hashString(normalizeViteImportAnalysisUrl(id))`)
- **Production**: Based on file path hash (same algorithm)

Example from server build:
```javascript
// dist/rsc/mixed.js
const InteractiveH1 = registerClientReference(
  () => { throw new Error("...") },
  "5d8f14cf3c81",  // ← Component ID
  "InteractiveH1"
);
```

### 2. RSC Client (`apps/web`)

The client consumes RSC payloads and renders them using React 19 primitives.

#### Module Resolution Setup

**Problem**: `@vitejs/plugin-rsc` doesn't automatically scan workspace packages for client components, so the `virtual:vite-rsc/client-references` map is empty.

**Solution**: Manual `setRequireModule` initialization with fallback mappings:

```typescript
// apps/web/src/lib/rsc-client.ts
import { setRequireModule } from '@vitejs/plugin-rsc/react/browser';
import * as clientReferences from 'virtual:vite-rsc/client-references';

setRequireModule({
  load: async (id) => {
    if (!import.meta.env.__vite_rsc_build__) {
      // Dev mode: try direct import, fallback to workspace package
      try {
        return await import(/* @vite-ignore */ id);
      } catch {
        // Fallback for workspace components
        if (id === '214e63e75c72' || id === '5d8f14cf3c81') {
          const components = await import('@poc-rsc-payload/components');
          if (id === '214e63e75c72') return { ClientCounter: components.ClientCounter };
          if (id === '5d8f14cf3c81') return { InteractiveH1: components.InteractiveH1 };
        }
        throw new Error(`client reference not found '${id}'`);
      }
    } else {
      // Production: use client-references map, fallback to workspace package
      const import_ = clientReferences.default[id];
      if (import_) {
        return import_();
      }
      // Fallback for workspace components
      if (id === '214e63e75c72' || id === '5d8f14cf3c81') {
        const components = await import('@poc-rsc-payload/components');
        if (id === '214e63e75c72') return { ClientCounter: components.ClientCounter };
        if (id === '5d8f14cf3c81') return { InteractiveH1: components.InteractiveH1 };
      }
      throw new Error(`client reference not found '${id}'`);
    }
  },
});
```

**How it works:**
1. When the RSC payload contains a client component reference (e.g., `"5d8f14cf3c81"`), React calls `setRequireModule.load(id)`
2. The function first checks the `client-references` map (empty for workspace packages)
3. Falls back to hardcoded component ID → import mapping
4. Imports the component from `@poc-rsc-payload/components` and returns it

#### RSC Payload Consumption

```typescript
// apps/web/src/lib/rsc-client.ts
import { createFromFetch } from '@vitejs/plugin-rsc/react/browser';

export function parseRscMixedPayload(markdown: string): Promise<RscPayload> {
  const responsePromise = fetch(`${RSC_SERVER_URL}/render-mixed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/x-component',
    },
    body: JSON.stringify({ markdown }),
  });
  
  // createFromFetch deserializes the RSC stream
  return createFromFetch<RscPayload>(responsePromise);
}
```

**Usage in components:**
```typescript
// apps/web/src/routes/test-rsc.tsx
import { use } from 'react';
import { parseRscMixedPayload } from '@/lib/rsc-client';

function TestComponent() {
  const [promise, setPromise] = useState<Promise<RscPayload> | null>(null);
  
  const handleClick = () => {
    const p = parseRscMixedPayload("# Hello\n\nWorld!");
    setPromise(p);
  };
  
  return (
    <div>
      <button onClick={handleClick}>Render RSC</button>
      {promise && <RscPayloadRenderer promise={promise} />}
    </div>
  );
}

function RscPayloadRenderer({ promise }: { promise: Promise<RscPayload> }) {
  // React 19's use() hook unwraps the promise and renders the RSC payload
  const payload = use(promise);
  return <>{payload.content}</>;
}
```

### 3. Shared Components (`packages/components`)

The shared package contains both server and client components:

```typescript
// packages/components/src/markdown-renderer.tsx (Server Component)
import { InteractiveH1 } from './interactive-h1'; // Client component

export function MarkdownRenderer({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <InteractiveH1>{children}</InteractiveH1>,
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
```

```typescript
// packages/components/src/interactive-h1.tsx (Client Component)
"use client";

import { useState } from 'react';

export function InteractiveH1({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  return (
    <h1 onClick={() => setCount(c => c + 1)}>
      {children} (clicked {count} times)
    </h1>
  );
}
```

**Key Points:**
- Server components can import and use client components
- Client components are marked with `"use client"` directive
- The RSC payload serializes server components and references client components by ID

## RSC Payload Format (Flight)

The RSC payload is a stream of instructions in Flight format:

```
8:I["5d8f14cf3c81",[],"InteractiveH1",1]
:N1763047053425.7847
2:{"name":"MarkdownRenderer","key":null,"env":"Server",...}
4:"$EObject.defineProperty(({ children }) => ...)"
...
```

**Format breakdown:**
- `8:I[...]` - Client component reference (ID, props, name, flags)
- `2:{...}` - Server component instance (name, props, stack trace)
- `4:"$E..."` - Function/object reference
- `0:{...}` - Root payload structure

## Build Process

### Server Build

```bash
cd apps/server
pnpm build:rsc  # Builds RSC entry points
```

**Output:**
- `dist/rsc/index.js` - Server-only RSC handler
- `dist/rsc/mixed.js` - Mixed RSC handler
- `dist/rsc/__vite_rsc_assets_manifest.js` - Component ID → asset mapping

### Client Build

```bash
cd apps/web
pnpm build
```

**Output:**
- `dist/client/` - Client bundle
- `dist/rsc/__vite_rsc_assets_manifest.js` - Client references map (empty for workspace packages)

## Development Workflow

1. **Start RSC Server:**
   ```bash
   cd apps/server
   pnpm build:rsc  # Build RSC entries
   pnpm dev        # Start Hono server on :4000
   ```

2. **Start Web Client:**
   ```bash
   cd apps/web
   pnpm dev        # Start Vite dev server on :4001
   ```

3. **Test:**
   - Visit `http://localhost:4001/test-rsc`
   - Click "Fetch & Parse Mixed RSC Payload"
   - The markdown should render with an interactive H1 component

## Key Technical Challenges & Solutions

### Challenge 1: Workspace Package Component Scanning

**Problem**: `@vitejs/plugin-rsc` doesn't automatically scan workspace packages for client components, so `virtual:vite-rsc/client-references` is empty.

**Solution**: Manual `setRequireModule` with hardcoded component ID mappings. This works because:
- Component IDs are stable (based on file path hash)
- Server and client use the same component source files
- The IDs match between server build and client runtime

### Challenge 2: Module Resolution in Dev vs Production

**Problem**: Dev mode uses different module resolution than production.

**Solution**: Conditional logic in `setRequireModule.load()`:
- Dev: Try direct import, fallback to workspace package
- Production: Use `client-references` map, fallback to workspace package

### Challenge 3: RSC Plugin Configuration

**Problem**: The plugin requires all environments (`rsc`, `client`, `ssr`) to have entry points.

**Solution**: Minimal placeholder entries for unused environments:
```typescript
// apps/server/src/entry.client.tsx
export default function ClientEntry() { return null; }
```

## Component ID Mapping

Current component IDs (from server build):
- `"214e63e75c72"` → `ClientCounter`
- `"5d8f14cf3c81"` → `InteractiveH1`

These IDs are generated by `@vitejs/plugin-rsc` using:
```typescript
hashString(normalizeViteImportAnalysisUrl(id))
```

To find new component IDs:
1. Check `apps/server/dist/rsc/__vite_rsc_assets_manifest.js`
2. Or inspect the RSC payload: `curl -X POST http://localhost:4000/render-mixed ...`

## Future Improvements

1. **Automatic Component ID Discovery**: Generate the component ID mapping from the server build manifest
2. **Type Safety**: Add TypeScript types for component IDs
3. **Hot Module Replacement**: Enable HMR for RSC payloads in dev mode
4. **Caching**: Cache RSC payloads on the client side
5. **Streaming**: Support streaming RSC payloads for better performance

## References

- [`@vitejs/plugin-rsc` Documentation](https://www.npmjs.com/package/@vitejs/plugin-rsc)
- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [Flight Protocol Specification](https://github.com/facebook/react/blob/main/packages/react-server/src/ReactFlightServer.js)
