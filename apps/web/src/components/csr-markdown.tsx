"use client";

import { MarkdownRenderer } from '@poc-rsc-payload/components/client';

export function CsrMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="border rounded p-4">
      <h2 className="text-sm font-mono mb-2">CSR Rendered</h2>
      <MarkdownRenderer markdown={markdown} />
    </div>
  );
}

