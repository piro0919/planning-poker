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

## 📄 License

MIT
