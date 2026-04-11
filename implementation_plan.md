# Goal Description
Develop a mobile-optimized, multiplayer Texas Hold'em poker web application. The frontend will be built with React and the backend with Node.js (v24.x) and TypeScript. The application requires real-time game state synchronization, automated turn management, dynamic blind increases, and real-time hand-winning probabilities (equity).

## User Review Required
> [!IMPORTANT]
> The application uses WebSockets (Socket.IO) for real-time multiplayer functionality. Free hosting platforms usually put free instances to "sleep" after a period of inactivity, which closes WebSocket connections. Please let me know if you would like me to use a specific hosting platform from the options proposed below.

## Proposed Changes

We will use a monorepo setup (or two separate folders) containing the frontend and the backend.

### Backend (Node.js 24.x, TypeScript, Socket.io)
We will build a custom game engine that operates as a State Machine connected to Socket.io to manage the rooms and poker logic.
*   **Poker Logic Integration:** I recommend using `pokersolver` to evaluate winning hands and a custom Monte Carlo simulator or an npm package like `poker-odds-calculator` to display the winning percentage in real-time.
*   **Room Management:** Support for creating and joining rooms with unique Room IDs.
*   **Game Loop:** Auto-rotation of the dealer, automatic blind posting, timer-based blind increases, and strict action validation (Check, Bet, Fold, Raise).

#### [NEW] `backend/src/server.ts`
Entry point for the Express and Socket.io server.
#### [NEW] `backend/src/game/GameRoom.ts`
Class controlling the entire lifecycle of a single Poker match (deck dealing, turn system).
#### [NEW] `backend/src/game/Player.ts`
Class representing a connecting player, their stack, cards, and socket ID.

---

### Frontend (React, Vite, Vanilla CSS)
A mobile-first, highly aesthetic UI with dynamic animations to provide a premium feel, avoiding vanilla generic looks.
*   **Authentication/Entry:** Screen to input Player Name.
*   **Lobby Screen:** Options to Create or Join a Room. Configure starting chips and blind increment intervals. Dynamic list of joined players.
*   **Game Table Screen:** The main Texas Hold'em interface.
    *   Visual representation of the table, community cards, player slots.
    *   Controls: Check, Bet/Raise (with chip slider), Fold.
    *   Stat Infographic: Real-time calculation of hand win-percentage.

#### [NEW] `frontend/src/App.tsx`
Main routing and state structure.
#### [NEW] `frontend/src/components/EntryScreen.tsx`
Name insertion component.
#### [NEW] `frontend/src/components/LobbyScreen.tsx`
Room creation/join component and settings (chips, blinds).
#### [NEW] `frontend/src/components/GameTable.tsx`
Main game view component handling animations and game state UI.
#### [NEW] `frontend/src/index.css`
Advanced CSS styling tailored for mobile-first rendering with glassmorphism and modern colors.

## Hosting & Deployment (Free Tier Solutions)

> [!TIP]
> For free hosting that supports Node.js WebSockets, we have a few options in 2026:
> 1.  **Backend:** **Render** (Free tier exists but instances sleep after inactivity, dropping connections until woken) or **Fly.io** (Better for long-running processes but requires a credit card for identity verification).
> 2.  **Frontend:** **Vercel** or **Netlify** is perfect and entirely free for the React application.
> 
> *My Recommendation: We deploy the Frontend to Vercel and the Backend to Render for the easiest free setup.*

## Open Questions
1. Do you agree with the proposed technology stack (Vite + React + Socket.io + Express TS)?
2. The UI needs to be premium and mobile-first. Do you have any specific color palette preferences (e.g., dark mode casino green, neon cyberpunk, minimal dark), or should I design a modern sleek dark mode?
3. Should we proceed with creating the initial folder structure and setting up the basic Socket.io connection? 

## Verification Plan

### Automated Tests
*   We can write unit tests for the Poker logic (`GameRoom.ts`) to ensure pots are split correctly and winners are evaluated accurately using standard Texas Hold'em rules.

### Manual Verification
*   We'll start both the frontend and backend locally.
*   I will open two separate browser sessions to simulate two players interacting, joining the same room, and playing a few hands to verify state syncing, the equity calculator, and automatic dealer switching.
