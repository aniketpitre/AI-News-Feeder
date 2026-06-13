TECH_SYNC.
An AI-driven technology news aggregation portal with an "Elegant Dark" theme, featuring an interactive, igloo.inc-inspired 3D hero section built with React Three Fiber.
Features

Interactive 3D Hero — a mouse-reactive distorted neon orb with orbiting satellites, parallax camera movement, and a cursor-following gradient headline
News Grid — placeholder layout for DevOps, Kubernetes, AI/ML, and Cyber SOC articles (added manually)
RSS Aggregation API — /api/rss/parse fetches and summarizes RSS feeds via the Gemini API
Firebase Integration — auth and Firestore setup for future content management

Tech Stack

Next.js 15 (App Router) + React 19
Tailwind CSS v4
React Three Fiber + drei for 3D
Firebase (Auth + Firestore)
Google Gemini API for article summarization

Getting Started
Prerequisites

Node.js 18+

Installation
bashnpm install --legacy-peer-deps

--legacy-peer-deps is required due to a peer dependency mismatch between lucide-react and React 19.

Environment Variables
Create a .env.local file in the project root:
GEMINI_API_KEY=your_gemini_api_key
Firebase configuration is read from firebase-applet-config.json.
Development
bashnpm run dev
Open http://localhost:3000.
Production Build
bashnpm run build
npm run start
Project Structure
app/
  page.tsx          # Homepage with 3D hero + news grid
  layout.tsx        # Root layout, navigation, ticker
  articles/         # Articles page (placeholder)
  api/rss/parse/    # RSS aggregation + Gemini summarization endpoint
components/
  HeroCanvas.tsx    # Interactive 3D scene
  Navigation.tsx    # Top navigation bar
  AuthProvider.tsx  # Firebase auth context
  ui/               # shadcn/ui components
lib/
  firebase.ts       # Firebase client setup
  firebase-utils.ts # Firestore helper utilities
Notes

Articles are currently added manually; there is no admin/CMS interface in this branch.
The 3D hero responds to mouse movement — orb distortion, position, and camera parallax all react to cursor position for an interactive feel.
