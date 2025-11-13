declare module 'virtual:vite-rsc/client-references' {
  const clientReferences: {
    default: Record<string, () => Promise<unknown>>;
  };
  export default clientReferences.default;
}

