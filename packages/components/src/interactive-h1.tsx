"use client";

import { useState } from 'react';

export function InteractiveH1({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  
  return (
    <div className="flex items-center gap-2">
      <h1>{children}</h1>
      <button
        onClick={() => setCount(c => c + 1)}
        className="px-2 py-1 bg-blue-500 text-white rounded"
      >
        Count: {count}
      </button>
    </div>
  );
}

