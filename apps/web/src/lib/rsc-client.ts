export type RscPayload = {
  content: React.ReactNode;
};

const RSC_SERVER_URL = import.meta.env.VITE_RSC_SERVER_URL || 'http://localhost:4000';

// Step 1: Fetch raw RSC payload from server
// Returns the raw Response for inspection/logging
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

// RSC Payload structure types
export type RscPayloadParseResult = {
  contentType: string;
  bodyText: string;
  bodyArrayBuffer: ArrayBuffer;
  // Parsed structure
  lines: string[];
  componentReferences: Array<{
    id: string;
    componentName: string;
    line: string;
  }>;
  componentDefinitions: Array<{
    name: string;
    env: string;
    props: unknown;
    line: string;
  }>;
  rootPayload: unknown;
};

// Step 2: Parse and analyze the RSC payload structure
export async function parseRscPayload(response: Response): Promise<RscPayloadParseResult> {
  const contentType = response.headers.get('content-type') || 'unknown';
  
  // Clone response to read body multiple times
  const clonedResponse = response.clone();
  const bodyText = await response.text();
  const bodyArrayBuffer = await clonedResponse.arrayBuffer();
  
  // Parse RSC payload format (line-based)
  const lines = bodyText.split('\n').filter(line => line.trim().length > 0);
  
  // Extract component references (format: "7:I["id",[],"ComponentName",1]")
  const componentReferences: Array<{ id: string; componentName: string; line: string }> = [];
  const componentRefPattern = /^(\d+):I\["([^"]+)",\[\],"([^"]+)",\d+\]$/;
  
  for (const line of lines) {
    const match = line.match(componentRefPattern);
    if (match) {
      componentReferences.push({
        id: match[2],
        componentName: match[3],
        line: line,
      });
    }
  }
  
  // Extract component definitions (format: "2:{"name":"ComponentName","env":"Server",...}")
  const componentDefinitions: Array<{ name: string; env: string; props: unknown; line: string }> = [];
  const componentDefPattern = /^(\d+):(\{.*\})$/;
  
  for (const line of lines) {
    const match = line.match(componentDefPattern);
    if (match) {
      try {
        const def = JSON.parse(match[2]);
        if (def.name && def.env) {
          componentDefinitions.push({
            name: def.name,
            env: def.env,
            props: def.props,
            line: line,
          });
        }
      } catch (e) {
        // Not a JSON component definition, skip
      }
    }
  }
  
  // Extract root payload (format: "0:{"content":"$1"}")
  let rootPayload: unknown = null;
  const rootPattern = /^0:(.+)$/;
  for (const line of lines) {
    const match = line.match(rootPattern);
    if (match) {
      try {
        rootPayload = JSON.parse(match[1]);
      } catch (e) {
        // Not JSON, keep as string
        rootPayload = match[1];
      }
    }
  }
  
  const parseResult: RscPayloadParseResult = {
    contentType,
    bodyText,
    bodyArrayBuffer,
    lines,
    componentReferences,
    componentDefinitions,
    rootPayload,
  };
  
  console.log('RSC Payload Parse Result:', {
    contentType,
    totalLines: lines.length,
    componentReferences: componentReferences.length,
    componentDefinitions: componentDefinitions.length,
    componentReferencesDetails: componentReferences,
    componentDefinitionsDetails: componentDefinitions,
    rootPayload,
  });
  
  console.log('Full payload (first 1000 chars):', bodyText.substring(0, 1000));
  
  return parseResult;
}

// Step 3: Render components (will be implemented next)
// This will require adding @vitejs/plugin-rsc back with proper configuration

