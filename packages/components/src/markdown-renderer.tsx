// Server component - no "use client"
import ReactMarkdown from 'react-markdown';
import { InteractiveH1 } from './interactive-h1';

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

