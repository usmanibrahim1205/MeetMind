# MeetMind Frontend - React SPA

This is the frontend single-page application (SPA) for MeetMind, built using **React v18**, **Vite**, and **Vanilla CSS Variables** (no CSS framework).

## Key Features

1. **Cardless Flow UI**: Fully borderless, shadowless design. Content panels blend directly into the background canvas with clean vertical spacing and line-tabs.
2. **Off-White Default Light Theme**: The application defaults to Light Mode with a custom `#F4F5F8` background that minimizes screen glare, contrasting against pure white inputs and form fields.
3. **Collapsible Sidebar**: A docked left sidebar that spans the full height of the viewport. Can be collapsed on desktop (reducing to `0px` and showing a Menu hamburger toggle in the top navbar) and overlays on mobile.
4. **Frictionless Onboarding Notice**: Displays a Developer Showcase modal notice on initial load, letting visitors know the account verification is bypassed for testing.

## Folder Architecture

```
frontend/
│
├── public/           # Static assets
├── src/
│   ├── assets/       # Brand icons and logo
│   ├── components/   # Shared elements (Sidebar, Navbar, Toast, Dialogs)
│   ├── pages/        # Dashboard pages (LandingPage, Dashboard, Settings, Details)
│   ├── services/     # Axios client configuration
│   ├── styles/       # theme.css presets
│   ├── App.jsx       # Routing wrapper and sidebar state management
│   └── main.jsx      # Vite mounting index
│
├── index.html        # Main template
└── package.json      # Dependencies (axios, lucide-react, canvas-confetti)
```

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Compile for production:
   ```bash
   npm run build
   ```
4. Run the linter code quality checks:
   ```bash
   npm run lint
   ```
