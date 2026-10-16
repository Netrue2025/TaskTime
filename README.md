# TaskLite

TaskLite is a mobile-first progressive web app for daily planning, reminders, delegated tasks, lightweight remarks, and completion analytics. A completion rate of 70% or more is a pass; an empty period is shown as **no score**, never as a failure.

## Stack

- React, Vite, and TypeScript
- Node.js, Express, and TypeScript
- MongoDB and Mongoose
- Agenda for durable MongoDB-backed reminder jobs
- Web Push with VAPID
- One Railway service serving both `/api` and the compiled PWA

## Local setup

Requirements: Node.js 20+, npm, and MongoDB 7+ (local or Atlas).

```bash
cp .env.example .env
npm install
npm run dev
```

The frontend opens at `http://localhost:5173`; Vite proxies `/api` to Express at `http://localhost:3000`.

Set `MONGODB_URI` to a database the API can reach. Generate a strong `JWT_SECRET` with at least 32 characters. The default secret is development-only and startup validation prevents a short value.

## Push notifications and VAPID

Generate keys once:

```bash
npx web-push generate-vapid-keys
```

Copy the public/private keys to `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`, and set `VAPID_SUBJECT` to a `mailto:` or HTTPS contact. The browser asks for permission only after the user chooses **Task reminders** in Profile.

For Railway, add all three values under **Service → Variables**, then redeploy. VAPID keys must remain stable: replacing them invalidates existing browser subscriptions.

Task reminders are persistent Agenda jobs, not timers. Every task has a start and end time. A start notification is sent to the responsible user, then an overdue notification is sent after the end time if the task is still incomplete. For shared tasks, the overdue notice also reaches the owner. Jobs are rescheduled on time changes, cancelled on completion/deletion, and re-check the task before sending. Browsers and operating systems control the final notification appearance and sound; TaskLite requests normal audible behavior, uses a red warning icon/title for overdue tasks, and requests a persistent overdue notice where supported. Push requires HTTPS in production and must be tested on a supported real device.

## PWA and offline behavior

The app registers `public/sw.js`, includes an install manifest and maskable icon, and caches the application shell. API responses are deliberately excluded from caching. Offline mode can reopen cached UI, but task changes require a connection.

To install, use the browser’s **Install app** option on supported Android/desktop browsers. On iOS Safari, use **Share → Add to Home Screen**.

## Quality checks

```bash
npm run typecheck
npm test
npm run build
# or all three
npm run check
```

The unit suite covers the exact 70% threshold, 69% non-pass, zero-task no-score, and timezone day boundaries. The repository is structured so integration tests can point at an isolated MongoDB database without changing production code.

## Railway deployment

1. Create a MongoDB Atlas database and allow Railway network access.
2. Create a Railway service from this repository with the root directory set to `tasklite` if the PDF remains in the parent folder.
3. Add every variable from `.env.example`. Set `NODE_ENV=production`, `APP_URL` to the final HTTPS Railway/custom domain, and a strong `JWT_SECRET`.
4. Deploy with one replica for the MVP. `railway.json` installs the root and three focused packages, runs the production build, starts Express, and checks `/api/health`.
5. Confirm the manifest and service worker load from the production domain, then test install and real Web Push on a supported phone.

Startup connects MongoDB, starts Agenda, then binds Express to `0.0.0.0:$PORT`. SIGTERM/SIGINT stop the scheduler and database connection cleanly.

## API overview

Authentication: `/api/auth/register`, `/login`, `/logout`, `/me`

Tasks: `/api/tasks`, `/:id`, `/:id/complete`, `/:id/uncomplete`, `/:id/assign`, `/:id/unassign`

Collaboration: `/api/users/search`, `/api/tasks/:id/remarks`

Progress: `/api/progress/daily`, `/weekly`, `/monthly`

Push: `/api/push/subscribe`, `/unsubscribe`, `/test`

All private access is derived from the signed HTTP-only session cookie. Owner/assignee authorization is checked server-side; client-supplied identity is never accepted for permission decisions. Shared progress images contain only the percentage, counts, date, and TaskLite branding—never task titles.
