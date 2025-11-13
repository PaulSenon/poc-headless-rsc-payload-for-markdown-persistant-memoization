"use client";

import { MarkdownRendererClientOnly } from '@poc-rsc-payload/components';

export function CsrMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="border rounded p-4">
      <h2 className="text-sm font-mono mb-2">CSR Rendered</h2>
      <MarkdownRendererClientOnly markdown={markdown} />
    </div>
  );
}

