# Planning Poker

> Online planning poker for Scrum team story point estimation.

[🔗 Live Demo](https://planning-poker.kkweb.io)

## ✨ Features

- 🃏 Fibonacci-style story point cards
- 👥 Real-time team sessions
- 📊 Vote reveal and results summary
- 📱 Responsive design
- 🌐 English and Japanese (English at `/`, Japanese at `/ja`)

## 🛠 Tech Stack

- Next.js + React + TypeScript (hosted on Vercel)
- Cloudflare Workers + Durable Objects for the realtime room state
- next-intl for the UI copy and the per-language metadata

The wording lives in `messages/en.json` and `messages/ja.json`; `src/i18n/routing.ts`
decides which languages exist and which one is the default.

Each room is one Durable Object. Clients hold a single WebSocket to it, and the
room deletes itself two days after it was last touched.

## 🚀 Development

Run the room server and the site side by side:

```bash
npm install
npm run worker:dev   # http://localhost:8787
npm run dev          # http://localhost:3000
```

Point `NEXT_PUBLIC_ROOM_ORIGIN` in `.env.local` at the room server.

## ✅ Checks

CI runs all of these on every push to `main`:

```bash
npm run lint && npm run lint:worker && npm run lint:style:check
npm run format:check && npm run lint:secret && npm run knip
npm run type-check && npm run worker:type-check
npm test             # unit tests (Vitest)
npm run test:e2e     # builds the app, starts a local worker, drives it in Playwright
npm run lighthouse   # builds the app and checks the Lighthouse scores
```

The room server is not deployed by CI. Release it with `npm run worker:deploy`.

## 📄 License

MIT
