import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { Component, type ReactNode } from "react";
import { parseRscMixedPayload, type RscPayload } from "@/lib/rsc-client";
import { CsrMarkdown } from "@/components/csr-markdown";
import { RscMarkdown } from "@/components/rsc-markdown";

// Three different markdown content examples
const MARKDOWN_1 = `# First Example

This is the **first** markdown example with an interactive H1 component.

It includes:
- Bullet points
- **Bold** text
- *Italic* text
- \`code\` snippets
`;

const MARKDOWN_2 = `# Second Example

This is the **second** markdown example demonstrating different content.

## Features

1. Numbered lists
2. Multiple heading levels
3. Interactive H1 at the top

> Blockquote example
`;

const MARKDOWN_3 = `# Third Example

This is the **third** markdown example with more complex formatting.

### Code Block Example

\`\`\`typescript
function example() {
  return "Hello, World!";
}
\`\`\`

**Note**: The H1 above is interactive and clickable!
`;

export const Route = createFileRoute("/rsc-comparison")({
  loader: async () => {
    // Fetch and await all 3 RSC payloads in parallel
    // This mimics static payloads - all fully resolved before rendering
    const markdowns = [MARKDOWN_1, MARKDOWN_2, MARKDOWN_3];
    const payloads = await Promise.all(
      markdowns.map((md) => parseRscMixedPayload(md))
    );
    
    return {
      payloads,
      markdowns,
    };
  },
  component: ComparisonPage,
});

function ComparisonPage() {
  const { payloads, markdowns } = useLoaderData({ from: "/rsc-comparison" });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">RSC vs CSR Comparison</h1>
      <p className="text-gray-600 mb-8">
        Side-by-side comparison of Client-Side Rendered (CSR) markdown vs
        React Server Component (RSC) payload rendered markdown. RSC payloads
        are fully awaited in the loader to mimic static payloads.
      </p>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Client-Side Rendered</h2>
          <p className="text-sm text-gray-500">
            Rendered using ReactMarkdown on the client
          </p>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">RSC Payload Rendered</h2>
          <p className="text-sm text-gray-500">
            Rendered from pre-fetched RSC payload (mimics static)
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {markdowns.map((markdown, index) => (
          <div key={index} className="border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4 text-gray-700">
              Example {index + 1}
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="border-r pr-6">
                <RscErrorBoundary>
                  <CsrMarkdown markdown={markdown} />
                </RscErrorBoundary>
              </div>
              <div>
                <RscErrorBoundary>
                  <RscMarkdown payload={payloads[index]} />
                </RscErrorBoundary>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Error boundary for RSC payload rendering
class RscErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="text-sm text-red-600 border border-red-300 rounded p-4">
          <strong>Error rendering:</strong> {this.state.error.message}
          {this.state.error.stack && (
            <pre className="mt-2 text-xs whitespace-pre-wrap">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
