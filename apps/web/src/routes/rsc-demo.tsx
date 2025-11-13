import { createFileRoute } from '@tanstack/react-router';
import { CsrMarkdown } from '@/components/csr-markdown';
import { RscMarkdown } from '@/components/rsc-markdown';

const markdownExamples = [
  `# Example 1\n\nThis is a **bold** example with an interactive H1.`,
  `# Example 2\n\nThis has *italic* text and another interactive H1.`,
  `# Example 3\n\nThis is a third example with \`code\` and an interactive H1.`,
];

export const Route = createFileRoute("/rsc-demo")({
  component: DemoPage,
});

function DemoPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">RSC vs CSR Comparison</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column: CSR Rendered */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Client-Side Rendered</h2>
          <div className="space-y-4">
            {markdownExamples.map((md, i) => (
              <CsrMarkdown key={i} markdown={md} />
            ))}
          </div>
        </div>
        
        {/* Right Column: RSC Rendered */}
        <div>
          <h2 className="text-xl font-semibold mb-4">RSC Payload Rendered</h2>
          <div className="space-y-4">
            {markdownExamples.map((md, i) => (
              <RscMarkdown key={i} markdown={md} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
