// Server component - no "use client"
import ReactMarkdown from 'react-markdown';
export function MarkdownRendererServerOnly({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      
    >
      {markdown}
    </ReactMarkdown>
  );
}

