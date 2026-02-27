# Mailgun Inbound Webhook — Implementation TODO

## What we're building

Sales head forwards coaching emails to a Mailgun address.
Mailgun parses them and POSTs to our Express backend.
Backend saves each email as a `Feedback` record in the DB.
AI coaching suggestions are then grounded in this real history.

---

## Step 1: Mailgun setup (their side)

- [ ] Sign up at mailgun.com (free tier — 5,000 emails/month, enough for this)
- [ ] Add a receiving domain OR use the Mailgun sandbox domain for POC
- [ ] Go to: Receive → Routes → Create Route
  - Expression: `match_recipient("sync@yourmailgundomain.com")` (or catch-all)
  - Action: `forward("https://your-backend-url/api/v1/sync/inbound")`
  - Store + Notify checked
- [ ] Note down the receiving email address (e.g. `sync@mg.yourdomain.com`)

---

## Step 2: Backend endpoint (our side)

- [ ] Create `backend/src/routes/syncRoutes.ts`
- [ ] Create `backend/src/controllers/syncController.ts`
- [ ] Wire up in `index.ts`: `app.use("/api/v1/sync", syncRoutes)`

### Endpoint: POST /api/v1/sync/inbound

Mailgun POSTs `multipart/form-data` with these fields we care about:

- `sender` — who sent it (the sales rep's email address)
- `subject` — email subject
- `stripped-text` — plain text body (Mailgun strips signatures/threads for us)
- `recipient` — who it was sent to (our sync address)

Logic:

1. Parse `sender` email
2. Try to match to a `SalesRep` by email field (add `email` field to SalesRep model — see Step 3)
3. If rep found → save as `Feedback` record with `category: "email-sync"`
4. If rep not found → save as unmatched (still store, just no repId) or log and skip
5. Return 200 (Mailgun retries if it gets anything else)

### Security: Mailgun webhook signature verification

- [ ] Add `MAILGUN_WEBHOOK_SIGNING_KEY` to `.env`
- [ ] Verify the `signature` in the Mailgun payload before processing
- [ ] Reference: https://documentation.mailgun.com/docs/mailgun/user-manual/webhook-security/

---

## Step 3: Prisma schema update

- [ ] Add `email` field to `SalesRep` model (optional, for matching incoming emails to reps)

```prisma
model SalesRep {
  id        String  @id @default(uuid())
  name      String
  role      String?
  team      String?
  email     String? @unique   // <-- add this
  ...
}
```

- [ ] Run `npx prisma migrate dev --name add-rep-email`

---

## Step 4: Ask sales head to do

- [ ] Give him the sync email address (e.g. `sync@mg.yourdomain.com`)
- [ ] Ask him to: select all emails in the coaching folder → Forward to that address
- [ ] One-time bulk forward for backfill — takes him 2 minutes
- [ ] For future emails: set up an Outlook rule to auto-forward from that folder

---

## Step 5: Test it

- [ ] Send a test email to the sync address manually
- [ ] Check backend logs — should see the POST hit
- [ ] Check DB — should see a new Feedback record
- [ ] Trigger a coaching draft — should reference the new feedback

---

## Notes

- Mailgun parses threading automatically (`stripped-text` removes quoted history)
- No Graph API, no admin consent, no app registration needed
- If we later get Graph API access, we can replace this with a proper delta sync
- Backend must be publicly reachable for Mailgun to POST to it (use ngrok for local dev)
  - `ngrok http 3001` → copy the https URL → paste into Mailgun route
