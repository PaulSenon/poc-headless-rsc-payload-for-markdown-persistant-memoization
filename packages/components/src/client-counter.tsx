"use client";

import { useState } from 'react';

export function ClientCounter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded">
      <span className="font-medium">Count: {count}</span>
      <button
        onClick={() => setCount(c => c + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Increment
      </button>
      <button
        onClick={() => setCount(0)}
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Reset
      </button>
    </div>
  );
}

