import { createFileRoute } from "@tanstack/react-router";
import { useState, Component, type ReactNode } from "react";
import { use } from "react";
import { parseRscPayload, fetchRawRscPayload, type RscPayload } from "@/lib/rsc-client";

export const Route = createFileRoute("/test-rsc")({
  component: TestRscComponent,
});

function TestRscComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rscPromise, setRscPromise] = useState<Promise<RscPayload> | null>(null);
  const [rawPayloadInfo, setRawPayloadInfo] = useState<{
    contentType: string;
    bodyLength: number;
  } | null>(null);

  const testRscServer = async () => {
    setLoading(true);
    setError(null);
    setRscPromise(null);
    setRawPayloadInfo(null);

    try {
      const markdown = "# Test RSC\n\nThis is a **test** markdown.";
      
      // Step 1: Fetch raw payload for inspection
      console.log("Step 1: Fetching raw RSC payload...");
      const rawResponse = await fetchRawRscPayload(markdown);
      const contentType = rawResponse.headers.get('content-type') || 'unknown';
      const clonedForInspection = rawResponse.clone();
      const bodyText = await clonedForInspection.text();
      
      setRawPayloadInfo({
        contentType,
        bodyLength: bodyText.length,
      });
      
      console.log("Step 1 complete: Raw payload info", { contentType, bodyLength: bodyText.length });
      
      // Step 2: Parse RSC payload using @vitejs/plugin-rsc/browser
      console.log("Step 2: Parsing RSC payload with createFromFetch...");
      const promise = parseRscPayload(markdown);
      setRscPromise(promise);
      
      // Wait for it to resolve to check for errors
      await promise;
      console.log("Step 2 complete: RSC payload parsed successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("RSC error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">RSC Server Test (Step by Step)</h1>
      <div className="space-y-4">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Step 1: Fetch Raw RSC Payload</h2>
          <button
            onClick={testRscServer}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Fetch & Parse RSC Payload"}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Check browser console for detailed payload information
          </p>
        </section>

        {error && (
          <section className="rounded-lg border p-4 border-red-500">
            <h2 className="mb-2 font-medium text-red-500">Error</h2>
            <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
          </section>
        )}

        {rawPayloadInfo && (
          <section className="rounded-lg border p-4">
            <h2 className="mb-2 font-medium">Step 1: Raw Payload Info</h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Content-Type:</strong> {rawPayloadInfo.contentType}
              </div>
              <div>
                <strong>Body Length:</strong> {rawPayloadInfo.bodyLength} bytes
              </div>
            </div>
          </section>
        )}

        {rscPromise && (
          <section className="rounded-lg border p-4">
            <h2 className="mb-2 font-medium">Step 2: Parsed RSC Payload</h2>
            <RscErrorBoundary>
              <RscPayloadRenderer promise={rscPromise} />
            </RscErrorBoundary>
          </section>
        )}
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
        <div className="text-sm text-red-600">
          Error rendering RSC payload: {this.state.error.message}
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

// Component to render the parsed RSC payload using React's use() hook
// Note: use() cannot be called inside try/catch - errors must be handled by error boundary
function RscPayloadRenderer({ promise }: { promise: Promise<RscPayload> }) {
  // React 19's use() hook unwraps the promise
  // Errors will be thrown to the nearest error boundary
  const payload = use(promise);
  
  return (
    <div className="space-y-2">
      <p className="text-sm text-green-600">✅ RSC payload parsed successfully!</p>
      <div className="border rounded p-4">
        <h3 className="text-sm font-medium mb-2">Rendered Content:</h3>
        <div className="prose prose-sm max-w-none">
          {payload.content}
        </div>
      </div>
    </div>
  );
}
