// Server component - no "use client"
import { ClientCounter } from './client-counter';

export function MixedComponent({ title }: { title: string }) {
  return (
    <div className="space-y-4 p-4 border rounded">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-gray-600">
        This is a server component that renders a client component below:
      </p>
      <ClientCounter />
      <p className="text-sm text-gray-500">
        The counter above is a client component with interactivity.
      </p>
    </div>
  );
}

