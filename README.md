# RSC Payload PoC - Technical Documentation

A proof-of-concept demonstrating **headless React Server Components (RSC)** rendering using `@vitejs/plugin-rsc` in a monorepo setup. This project shows how to decouple RSC server rendering from client consumption, enabling static RSC payload generation and client-side hydration.

Purpose: try to find a way to cache rendering of some components (e.g. llm generated chat to not reparse/rerender markdown messages every time) To use it as a persistant memoization.
Because RSC allow caching the static output, and still have some hydratable island inside. Perfect for markdown content in chats that contains mainly static things but might require some little client-side interractivity sometime (e.g. copy to clipboard, toggle line breaks, etc.)

Ultimately the goal will be to progressively enhance a llm chat app, with either web-worker implementaion of RSC server, that could on demand, in the background, generate the RSC version of each raw mardkdown responses, and cache it in indexeddb, non reactive, and next time the user open chat, if any matching prerendered RSC version is found it uses it, otherwise it rerenders the markdown normally.
Or we could imagine having some async workflow on server-side, that, without slowing the instant stream of llm resonse (raw markdown anyway), will, when persisting the markdown to db, also generate the RSC version and store it in a message cache table. Next time user fetch chat history, it will fetch and cache both raw and RSC version client side, then will be able to smoothly render from cache.

This would require bursting cache on 
- markdown content hash
- Internal sub react component used int our Message component (so if we change style/fix something, it burst all caches of all RSC messages with same markdown content.)


The biggest challenge here is to share component from server to client. So a rsc payload containing client component can be rendered on client side without errors. 

Current structure:
- apps/server => hono server that renders RSC payloads on demand from POST endpoints
- apps/web => a simple fully static tanstack router app, that will make fetch call to server
- packages/components => a shared package that contains both server and client components

> ![DISCLAIMER] 
> This is AI slope generated proof of concept because I needed to see of possible and was too hard to find similar experimentations online. So I vibe coded the shit out of it, it's crappy, it's unreadable, it's broken, it's horrible, but it porved it can work. I now have to redo everything and eventually spend time learning the concepts behind now. (because wasn't super confident with how RSC works under the hood)

Still if you want to run it:
- pnpm install
- pnpm dev

(but don't do it)