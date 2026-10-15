# Showpass frontend

A responsive React 19 + TypeScript + Vite client for the Showpass Spring Boot API. It includes event discovery and search, event details, registration/login, a demo ticket wallet, venue creation, and organizer lifecycle controls.

## Run

Use Node.js 22.12+ (Node 24 is supported) and npm. Start MongoDB, Redis, and the backend using the root README, then:

```sh
cd frontend
npm ci
npm run dev
```

The development server uses port 5173 and proxies `/api` to the backend on port 3000. To use another backend, set `API_PROXY_TARGET` before starting Vite; it is a server-side proxy setting, not a credential. No CORS changes are needed for this setup.

New databases start with no events. Create an account, open **Organizer studio**, add a venue, create a draft, publish it, and open sales. Published, on-sale, and sold-out future events appear in Discover. Drafts, cancelled events, completed events, and past events are omitted from discovery; organizers can still see their own events. This is a UI filter, not an API authorization boundary: the backend currently exposes all events through its public list endpoint.

Sessions last as long as the backend JWT (two hours) and are stored in the current tab's session storage. Expired sessions prompt another sign-in. Dates are entered/displayed in the browser's local timezone and sent as UTC instants. Prices are displayed in USD; the backend stores integer cents and does not currently have a currency field. Payments are simulated and never collect card information or charge money.

## Build and browser validation

```sh
npm run build
npm run preview
```

The build type-checks the application and writes static assets to `dist`. Preview runs on port 4173 with the same API proxy. For deployment, serve `dist` with a web server that proxies `/api/*` to Spring Boot on the same origin. Vite's development proxy is not included in the static build. Navigation uses URL hashes, so no history fallback is required. A production deployment should use HTTPS. The backend remains an MVP with the limitations in the root README.

The browser tests exercise the real backend and insert uniquely named development users, venues, events, and orders. Run them only with a disposable development database:

```sh
# Start the backend with MongoDB and Redis first.
npx playwright install --with-deps chromium
npm run test:e2e
```

An existing system Chromium at `/usr/bin/chromium` is used automatically. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for another system installation; otherwise the downloaded Playwright browser is used. Tests start Vite automatically and run the organizer/attendee flow, discovery filters and draft visibility, and invalid login handling at desktop and mobile viewport sizes. They do not mock the API. `test-results` contains failure screenshots and traces and is ignored by Git.
