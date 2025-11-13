import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { fetchRawRscPayload, parseRscPayload, type RscPayloadParseResult } from "@/lib/rsc-client";

export const Route = createFileRoute("/test-rsc")({
  component: TestRscComponent,
});

function TestRscComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payloadInfo, setPayloadInfo] = useState<RscPayloadParseResult | null>(null);

  const testRscServer = async () => {
    setLoading(true);
    setError(null);
    setPayloadInfo(null);

    try {
      // Step 1: Fetch raw payload
      console.log("Step 1: Fetching raw RSC payload...");
      const response = await fetchRawRscPayload("# Test RSC\n\nThis is a **test** markdown.");
      
      // Step 2: Parse and log the payload
      console.log("Step 2: Parsing and logging payload...");
      const info = await parseRscPayload(response);
      setPayloadInfo(info);
      
      console.log("Step 2 complete: Payload info logged to console");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("RSC fetch error:", err);
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

        {payloadInfo && (
          <section className="rounded-lg border p-4">
            <h2 className="mb-2 font-medium">Step 2: Parsed RSC Payload</h2>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Content-Type:</strong> {payloadInfo.contentType}
                </div>
                <div>
                  <strong>Total Lines:</strong> {payloadInfo.lines.length}
                </div>
                <div>
                  <strong>Body Length:</strong> {payloadInfo.bodyText.length} bytes
                </div>
                <div>
                  <strong>ArrayBuffer:</strong> {payloadInfo.bodyArrayBuffer.byteLength} bytes
                </div>
              </div>
              
              <div className="mt-4">
                <strong className="block mb-2">Component References ({payloadInfo.componentReferences.length}):</strong>
                {payloadInfo.componentReferences.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {payloadInfo.componentReferences.map((ref, i) => (
                      <li key={i} className="font-mono">
                        <span className="text-blue-600">{ref.componentName}</span>
                        {' '}(ID: <span className="text-purple-600">{ref.id}</span>)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-xs">No component references found</p>
                )}
              </div>
              
              <div className="mt-4">
                <strong className="block mb-2">Component Definitions ({payloadInfo.componentDefinitions.length}):</strong>
                {payloadInfo.componentDefinitions.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {payloadInfo.componentDefinitions.map((def, i) => (
                      <li key={i}>
                        <span className="font-mono text-green-600">{def.name}</span>
                        {' '}(<span className="text-orange-600">{def.env}</span>)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-xs">No component definitions found</p>
                )}
              </div>
              
              <div className="mt-4">
                <strong className="block mb-2">Root Payload:</strong>
                <pre className="mt-1 p-2 rounded bg-gray-50 text-xs overflow-auto max-h-32">
                  {JSON.stringify(payloadInfo.rootPayload, null, 2)}
                </pre>
              </div>
              
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">Raw Payload Preview (first 1000 chars)</summary>
                <pre className="mt-2 p-2 rounded bg-gray-50 text-xs overflow-auto max-h-40 font-mono">
                  {payloadInfo.bodyText.substring(0, 1000)}
                </pre>
              </details>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
