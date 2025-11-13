import { createFromFetch, createFromReadableStream, setRequireModule } from '@vitejs/plugin-rsc/react/browser';
import * as clientReferences from 'virtual:vite-rsc/client-references';

export type RscPayload = {
  content: React.ReactNode;
};

const RSC_SERVER_URL = import.meta.env.VITE_RSC_SERVER_URL || 'http://localhost:4000';

// Manually initialize setRequireModule and patch in workspace package components
// The automatic initialization from @vitejs/plugin-rsc/browser doesn't include
// workspace packages, so we need to extend the client-references map
setRequireModule({
  load: async (id) => {
    if (!import.meta.env.__vite_rsc_build__) {
      // Dev mode: try direct import
      try {
        return await import(/* @vite-ignore */ id);
      } catch {
        // Fallback: try resolving via workspace package
        // Component IDs from server build:
        // - "214e63e75c72" = ClientCounter
        // - "5d8f14cf3c81" = InteractiveH1
        if (id === '214e63e75c72' || id === '5d8f14cf3c81') {
          const components = await import('@poc-rsc-payload/components');
          if (id === '214e63e75c72') return { ClientCounter: components.ClientCounter };
          if (id === '5d8f14cf3c81') return { InteractiveH1: components.InteractiveH1 };
        }
        throw new Error(`client reference not found '${id}'`);
      }
    } else {
      // Production: use client-references map, with fallback for workspace components
      const import_ = clientReferences.default[id];
      if (import_) {
        return import_();
      }
      // Fallback for workspace package components not in the map
      // Component IDs from server build:
      // - "214e63e75c72" = ClientCounter
      // - "5d8f14cf3c81" = InteractiveH1
      if (id === '214e63e75c72' || id === '5d8f14cf3c81') {
        const components = await import('@poc-rsc-payload/components');
        if (id === '214e63e75c72') return { ClientCounter: components.ClientCounter };
        if (id === '5d8f14cf3c81') return { InteractiveH1: components.InteractiveH1 };
      }
      throw new Error(`client reference not found '${id}'`);
    }
  },
});

// Step 1: Fetch raw RSC payload from server (for inspection only)
export async function fetchRawRscPayload(markdown: string): Promise<Response> {
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
  
  return response;
}

// Step 2: Parse RSC payload using @vitejs/plugin-rsc/browser
// This properly deserializes the RSC stream into React elements
// Returns Promise<RscPayload> which can be used with React's use() hook
export function parseRscPayload(markdown: string): Promise<RscPayload> {
  const responsePromise = fetch(`${RSC_SERVER_URL}/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/x-component',
    },
    body: JSON.stringify({ markdown }),
  });
  
  // createFromFetch handles the RSC payload deserialization
  // It returns Promise<RscPayload> which resolves to the parsed React elements
  return createFromFetch<RscPayload>(responsePromise);
}

// Alternative: Parse from a ReadableStream (useful for cached payloads)
export function parseRscFromStream(stream: ReadableStream<Uint8Array>): Promise<RscPayload> {
  return createFromReadableStream<RscPayload>(stream);
}

// Mixed component endpoint (MarkdownRenderer with InteractiveH1)
export function parseRscMixedPayload(markdown: string): Promise<RscPayload> {
  const responsePromise = fetch(`${RSC_SERVER_URL}/render-mixed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/x-component',
    },
    body: JSON.stringify({ markdown }),
  });
  
  return createFromFetch<RscPayload>(responsePromise);
}

export async function fetchRawRscMixedPayload(markdown: string): Promise<Response> {
  const response = await fetch(`${RSC_SERVER_URL}/render-mixed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/x-component',
    },
    body: JSON.stringify({ markdown }),
  });
  
  if (!response.ok) {
    throw new Error(`RSC mixed fetch failed: ${response.statusText}`);
  }
  
  return response;
}

