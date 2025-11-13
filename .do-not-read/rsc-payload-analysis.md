# RSC Payload Analysis

## Payload Structure

The RSC payload contains:

1. **Component References**: `8:I["5d8f14cf3c81",[],"InteractiveH1",1]`
   - `5d8f14cf3c81` is the component ID
   - `InteractiveH1` is the component name
   - This needs to be resolved to a client module

2. **Server File Paths in Stack Traces**: 
   ```
   "file:///home/isaac/dev/poc-rsc-payload/apps/server/dist/rsc/index.js"
   ```
   - These are for debugging only
   - Not used for module resolution
   - Should be sanitized in production

## Module Map

Server generates `__vite_rsc_assets_manifest.js`:
```javascript
{
  "clientReferenceDeps": {
    "5d8f14cf3c81": {
      "js": ["/assets/index-l0sNRNKZ.js"]
    }
  }
}
```

## Problem

1. **Server paths are absolute** - won't work on client
2. **Component IDs need resolution** - client must map IDs to modules
3. **Client needs RSC plugin** - to provide module resolution runtime

## Solution

The client needs:
1. `@vitejs/plugin-rsc` configured (even if minimal)
2. Access to shared components (`@poc-rsc-payload/components`)
3. Module resolution runtime from `@vitejs/plugin-rsc/browser`

The plugin provides:
- Virtual modules for `@vitejs/plugin-rsc/browser`
- Module resolution that maps component IDs to client modules
- Runtime that handles RSC payload deserialization

## Next Steps

1. Add RSC plugin to `apps/web/vite.config.ts` with minimal config
2. Ensure shared components are available in client build
3. Test component resolution when rendering RSC payload

