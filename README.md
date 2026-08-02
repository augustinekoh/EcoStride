# EcoStride

A green mobility rewards platform that encourages walking and eco-friendly transportation. Users earn Eco-Coins and plant virtual trees while reducing carbon emissions.

## Project Structure

```
EcoStride/
├── ecostride-app/        # Frontend — React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # UI components (admin, city, controls, landing, map, merchant, modals, profile, social)
│   │   ├── hooks/        # Custom React hooks (community chat)
│   │   ├── lib/          # API client, Mapbox utilities
│   │   ├── stores/       # Zustand state management
│   │   └── assets/       # Static assets
│   └── .env              # Environment variables (see .env.example)
│
├── ecostride-backend/    # Backend — Cloudflare Workers + Hono + D1
│   ├── src/
│   │   ├── index.ts      # API routes
│   │   └── CommunityChatRoom.ts  # Durable Object for real-time chat
│   ├── schema.sql        # D1 database schema
│   └── wrangler.toml     # Cloudflare Workers config
│
└── README.md             # This file
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Zustand, Mapbox GL, Firebase Auth, TailwindCSS
- **Backend**: Cloudflare Workers, Hono, D1 (SQLite), Durable Objects
- **Auth**: Firebase Authentication (Email/Password)
- **Maps**: Mapbox GL JS

## Getting Started

### Prerequisites
- Node.js 18+
- Cloudflare account (for Workers & D1)
- Firebase project (for authentication)
- Mapbox account (for maps)

### Frontend
```bash
cd ecostride-app
cp .env.example .env     # Fill in your keys
npm install
npm run dev
```

### Backend
```bash
cd ecostride-backend
npm install
npm run db:init           # Initialize local D1 database
npm run dev               # Start local Workers dev server
```

## Features

- 🗺️ Interactive map with walking route simulation
- 🪙 Eco-Coin rewards for walking
- 🌳 Virtual tree planting
- 🏪 Merchant voucher store
- 👥 Community guilds with real-time chat (Durable Objects + WebSockets)
- 📬 In-app mailbox and notifications
- 🏆 Leaderboards
- 🔒 Admin dashboard
