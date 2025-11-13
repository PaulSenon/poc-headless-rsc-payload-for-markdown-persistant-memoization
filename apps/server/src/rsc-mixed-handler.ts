// RSC mixed handler - imports built RSC entry (built in RSC environment with react-server condition)
let renderHandler: ((request: Request) => Promise<Response>) | null = null;

async function loadRenderHandler() {
  if (renderHandler) return renderHandler;

  // Always use the built version - build happens in dev script before server starts
  try {
    // @ts-ignore - built file may not have types
    const builtHandler = await import('../dist/rsc/mixed.js');
    renderHandler = builtHandler.default;
  } catch (error) {
    console.error('Failed to load built RSC mixed handler:', error);
    throw error;
  }

  return renderHandler;
}

export async function rscMixedHandler(request: Request): Promise<Response> {
  try {
    const handler = await loadRenderHandler();
    if (!handler) {
      throw new Error('RSC mixed handler not loaded');
    }
    return handler(request);
  } catch (error) {
    console.error('RSC mixed handler error:', error);
    return new Response(JSON.stringify({ error: 'RSC mixed render failed', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

