'use server';
// Server component - no "use client"
import ReactMarkdown from 'react-markdown';
import { InteractiveH1 } from './interactive-h1';
import { MarkdownRenderer } from './markdown-renderer';



export async function MarkdownRendererHybrid({ markdown }: { markdown: string }) {
  const data = await new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(new Date().toISOString());
    }, 10000);
  });
  return (
    <>
      <h1>Hello from server: {data}</h1>
      <MarkdownRenderer markdown={markdown} />
    </>
  );
}

