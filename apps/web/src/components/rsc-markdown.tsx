"use client";

// Temporarily disabled for step-by-step testing
// Will be re-enabled in Step 3 (rendering components)
export function RscMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="border rounded p-4">
      <h2 className="text-sm font-mono mb-2">RSC Rendered (Step 3 - Coming Soon)</h2>
      <div className="text-gray-500">
        Step 1: Fetch raw payload ✓<br />
        Step 2: Parse/log payload ✓<br />
        Step 3: Render components (next step)
      </div>
    </div>
  );
}

