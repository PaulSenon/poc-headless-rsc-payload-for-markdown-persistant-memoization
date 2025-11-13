import { createFileRoute } from "@tanstack/react-router";
import { TestComponent } from "@poc-rsc-payload/components";

export const Route = createFileRoute("/test-shared")({
  component: TestSharedComponent,
});

function TestSharedComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shared Components Test</h1>
      <div className="space-y-4">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Shared Component from packages/components</h2>
          <TestComponent message="This component is imported from @poc-rsc-payload/components!" />
        </section>
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Default Message</h2>
          <TestComponent />
        </section>
      </div>
    </div>
  );
}

