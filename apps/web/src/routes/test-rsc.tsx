import { createFileRoute } from "@tanstack/react-router";
import { useState, use } from "react";
import { createFromFetch } from "@vitejs/plugin-rsc/browser";

export const Route = createFileRoute("/test-rsc")({
  component: TestRscComponent,
});

type RscPayload = {
  content: React.ReactNode;
};

function TestRscComponent() {
  const [rscPromise, setRscPromise] = useState<Promise<RscPayload> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testRscServer = async () => {
    setLoading(true);
    setError(null);
    setRscPromise(null);

    try {
      const response = await fetch("http://localhost:4000/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/x-component",
        },
        body: JSON.stringify({ markdown: "# Test RSC\n\nThis is a **test** markdown." }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const promise = createFromFetch<RscPayload>(Promise.resolve(response));
      setRscPromise(promise);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">RSC Server Test</h1>
      <div className="space-y-4">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Test RSC Server Connection</h2>
          <button
            onClick={testRscServer}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test RSC Server"}
          </button>
        </section>

        {error && (
          <section className="rounded-lg border p-4 border-red-500">
            <h2 className="mb-2 font-medium text-red-500">Error</h2>
            <pre className="text-sm text-red-600">{error}</pre>
          </section>
        )}

        {rscPromise && (
          <section className="rounded-lg border p-4">
            <h2 className="mb-2 font-medium">RSC Rendered Content</h2>
            <RscContent promise={rscPromise} />
          </section>
        )}
      </div>
    </div>
  );
}

function RscContent({ promise }: { promise: Promise<RscPayload> }) {
  const payload = use(promise);
  return <div className="p-4">{payload.content}</div>;
}
