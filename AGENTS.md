<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Langclaw product context

- Mantle-only wallet (chain ID `5000`).
- Chat modes: `chat` and `research` only (`onchain` → `research` in API client).
- Client model is fixed: `lib/chat-model.ts` → `gpt-5.4-nano`.
- Product README: [README.md](./README.md). API types: `lib/langclaw-api.ts`.
