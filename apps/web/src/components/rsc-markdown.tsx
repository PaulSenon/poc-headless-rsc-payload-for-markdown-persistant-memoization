"use client";

import type { RscPayload } from "@/lib/rsc-client";

export function RscMarkdown({ payload }: { payload: RscPayload }) {
  return (
    <div className="border rounded p-4">
      <h2 className="text-sm font-mono mb-2">RSC Rendered</h2>
      <div className="prose prose-sm max-w-none">
        {payload.content}
      </div>
    </div>
  );
}

