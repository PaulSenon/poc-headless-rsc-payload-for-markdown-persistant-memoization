// Server component - no "use client"
import ReactMarkdown from 'react-markdown';
import { InteractiveH1 } from './interactive-h1';
import { MarkdownRenderer } from './markdown-renderer';

export function MarkdownRendererClientOnly({ markdown }: { markdown: string }) {
  return (
    <>
      <h1>Hello from client: {new Date().toISOString()}</h1>
      <MarkdownRenderer markdown={markdown} />
    </>
  );
}

