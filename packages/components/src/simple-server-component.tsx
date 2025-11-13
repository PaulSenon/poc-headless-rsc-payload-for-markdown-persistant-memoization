// Server-only component - no "use client"
// This is a simple test component without any client components

import { MarkdownRendererServerOnly } from "./markdown-renderer-server-only";

export function SimpleServerComponent({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Server-Only RSC Component</h1>
      <div className="prose prose-sm max-w-none">
        <p>This component is rendered entirely on the server.</p>
        <p>Markdown content:</p>
        <MarkdownRendererServerOnly markdown={markdown} />
        <p>No client components are used, so no module resolution needed!</p>
      </div>
    </div>
  );
}

