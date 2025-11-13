// Minimal test component for verification
export function TestComponent({ message }: { message?: string }) {
  return <div>Test Component: {message || "Hello from shared components!"}</div>;
}

