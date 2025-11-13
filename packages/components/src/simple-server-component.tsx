// Server-only component - no "use client"
// This is a simple test component without any client components

export function SimpleServerComponent({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Server-Only RSC Component</h1>
      <div className="prose prose-sm max-w-none">
        <p>This component is rendered entirely on the server.</p>
        <p>Markdown content:</p>
        <pre className="bg-gray-100 p-4 rounded">{markdown}</pre>
        <p>No client components are used, so no module resolution needed!</p>
      </div>
    </div>
  );
}

