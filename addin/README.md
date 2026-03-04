# Sales Coach — Outlook Add-in

Outlook taskpane add-in that lets the sales manager generate AI-powered coaching replies directly from their inbox.

## How it works

1. Manager opens a rep's email in Outlook
2. Clicks **Sales Coach** in the ribbon → taskpane opens
3. Add-in reads the sender's email, looks up their coaching profile in the backend
4. Manager clicks **Generate Coaching Reply** → GPT-4o generates a draft based on the rep's history
5. Manager edits if needed, then clicks **Insert as Reply** → Outlook compose window opens pre-filled

---

## Dev setup

```bash
npm install
npm run dev        # starts Vite on https://localhost:5174
```

Run ngrok in a separate terminal pointed at the Vite port:

```bash
ngrok https 5174
```

Update the ngrok URL in `manifest.xml` if it changes (all occurrences of the domain).

The backend must also be running (`npm run dev` in `/backend`).

---

## Validating the manifest

```bash
npx office-addin-manifest validate -p manifest.xml
```

This fetches all icon URLs and validates schema, dimensions, and reachability. **The add-in dev server (Vite + ngrok) must be running** when you validate — Exchange fetches the icons server-side.

Icons are served from `public/` by Vite. Required sizes: 16, 32, 64, 80, 128px.

---

## Sideloading the add-in in Outlook

1. Open Outlook and go to: **https://aka.ms/olksideload**
2. In the left sidebar click **My add-ins**
3. Scroll to **Custom Add-ins** at the bottom
4. Click **+ Add a custom add-in** → **Add from file…**
5. Browse to and select `manifest.xml`
6. Confirm the warning — the add-in will appear in your ribbon

To update after manifest changes: remove the add-in from **My add-ins** and re-add it.

---

## Production build

From the `backend/` directory:

```bash
npm run build:full   # builds addin/dist then compiles backend TypeScript
```

Express serves `addin/dist` as static files — no separate web server needed in the container.

---

## Files

| File | Purpose |
|---|---|
| `manifest.xml` | Add-in manifest — submit this to Exchange / sideload |
| `src/Taskpane.tsx` | Main taskpane UI |
| `src/main.tsx` | Entry point — waits for `Office.onReady` before mounting |
| `public/` | Static assets (icons) served by Vite |
| `vite.config.ts` | Dev server config — HTTPS via basicSsl, proxy `/api` to Express |
