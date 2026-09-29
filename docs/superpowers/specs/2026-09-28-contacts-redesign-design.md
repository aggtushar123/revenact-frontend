# Contacts: every call analysed, sentiment you can explain, and Ask

Owner decisions of 2026-09-28. House rules: `.claude/skills/revenact-design/SKILL.md` §1 and §4. The owner's standing rules apply: pages must be app-ready, must never look like a spreadsheet, and must not lose information. The twice-filter privacy rule (#67, #68 and #70) applies to every read.

## 0. Why

The owner wants every call on any organisation or account to carry a sentiment, each contact's sentiment to follow from the calls they were on, and the Contacts page to be tied to organisations and accounts. Today:

- A call is analysed only when it is hand-logged on the page (`calls.classify_call`), and only from its title and summary. Calls from connectors and older calls are analysed only by `classify_interactions`, which is not scheduled on the server, so many calls have no sentiment.
- A contact's sentiment (`contact_sentiment.recompute`) already comes from their analysed calls, emails and tickets. Calls count most, and recent ones count more. The weights are call 1.0, ticket 0.8 and email 0.6.
- The Contacts page is a paginated table with stat cards and a company filter, and there is a separate, minimal profile page.

## 1. Every call gets a sentiment (backend)

- **When a call is analysed.** A call is classified when it is created: hand-logged, logged from "+ Add", or synced by a connector. Every path that creates a call calls one shared helper. A failure never blocks the call being saved.
- **What the analysis reads.** In order: the transcript text (capped as today), then the summary, then the title. The classifier input for a call is built from the best text available.
- **Nothing to read.** A call whose only text is a generic title, and which has no summary or transcript, is marked as not analysable: `ai_classified_at` is set and sentiment stays empty, with a flag or state the UI can read as "Not enough to analyse". It is never guessed.
- **Nightly catch-up.** `classify_interactions` runs nightly on the server, with a per-run limit and scoped to calls, emails and tickets. It is added to the deploy's schedule in `revenact-infra`, next to `run_health_maintenance`. Spend is metered against the workspace's AI credits as today, and stops cleanly when the budget runs out.
- **Contact sentiment follows immediately.** Classifying a call recomputes everyone on it (`recompute_for_records`), which already happens.

## 2. Contact sentiment (backend)

- **The mix stays as it is** (owner decision): calls, then tickets, then emails, weighted by recency, with the same thresholds.
- **The breakdown.** `sentiment_evidence` already stores the score, the counts by kind and by label, and `latest_at`. It is served on the contact.
- **A person's history.** `GET /api/v1/contacts/<id>/history/` returns their calls newest first. Each call has sentiment or "not analysable", summary, AI classification, duration, host, organisation and account (id and name), and a link. The response also has their emails and tickets, with sentiment where analysed.
  - Every row follows its own record rule: `visible_emails` (the owner-only mail rule), ticket departments, and account visibility.
  - A contact the viewer cannot open is a 404.
  - This replaces or extends today's contact interactions endpoint. The plan confirms which.
- **The contacts list.** The existing list endpoint gains these filters: organisation (`customer`), `account`, `sentiment` and `role`, plus search. Each row carries its organisation and account (id and name), its sentiment, its evidence counts and `last_contacted_at`. A summary (counts by sentiment and decision makers) covers the whole filtered set. The query count is pinned.

## 3. The Contacts page (frontend)

The layout is a list and a profile panel (owner's choice A), like the Communications inbox.

- **Header:**
  - A summary line: "142 people · 38 decision makers · 120 active · 61% positive · 12 negative · +12.5% growth (30d)" (active and growth from backend PR #71's `summary.active` / `summary.growth_30d_pct`; growth left out when null).
  - Search and filters for organisation, account, sentiment and role, all kept in the URL.
  - "+ Add".
- **The list, on the left.** One item per person, never a table row. Each item shows:
  - initials, name and role
  - "Organisation › Account", or the organisation alone
  - sentiment in words, with its colour, and "n calls" beside it
  - last contacted

  The list pages or loads more at the end. It has designed empty, loading and error states.
- **The profile, on the right, for the selected person** (`/contacts/:id` selects them):
  - Name, role, email and phone links (sanitised), and "Organisation › Account". Each links to `/organizations/:id`, and the account link opens that account's chip.
  - **Sentiment and why.** For example: "Neutral: 3 positive · 2 neutral · 1 negative across 6 calls and 2 emails, latest 12 Sep". There is a "Why this sentiment?" button (§4).
  - **Calls, newest first.** Each shows date, title, sentiment or "Not enough to analyse", the summary (expandable), the AI classification, the host and the organisation and account tag. Then emails and tickets.
  - Edit and Delete, using the existing flows.
- **Phones.** The list is full width, and choosing a person opens the profile as its own screen with a back link. Layouts for phone and desktop are rendered conditionally.
- **Removed.** The table, the stat cards (their figures move to the summary line) and the separate profile page, whose route now opens the panel.

## 4. Ask Revenact on Contacts (delivery 2)

- **The rail.** It is the same ✦ rail as on the Dashboard and Organizations, opened from the top bar. When it is open, the list narrows and the profile panel stays. On phones it opens as a sheet. One conversation carries across Contacts, Organizations and the Dashboard.
- **Context.** `{surface: "contacts", contact?: id, filters}`. The chip is server-labelled: "Lukas Vermeer · Kraft Heinz".
- **"Why this sentiment?"** opens the rail with that question ready and the contact in focus.
- **Backend.**
  - A `contacts` Ask surface. It re-checks that the viewer can open the contact.
  - It grounds the answer on the contact's profile, the sentiment breakdown and their calls, emails and tickets. Each record is under its own rule, and the content is fenced as untrusted.
  - It is metered under its own purpose.
  - Shared replies snapshot `grounded_records`, plus the customer ids, and fail closed exactly as on the organisation page (#70). History labels are built by the server.

## 5. Ties to the organisation page

- On the People tab, a person's name opens `/contacts/:id`.
- The Calls section shows every call's sentiment, or "Not enough to analyse".
- The contact profile links back to the organisation and, where relevant, to the account with its chip chosen.

## 6. Delivery

1. **Every call analysed, and the Contacts page.** A backend PR (§1, §2, and the schedule in `revenact-infra`), then a frontend PR (§3, §5).
2. **Ask on Contacts.** A backend PR, then a frontend PR (§4).

Each goes through subagent-driven development with a review per task, a final review, a controller browser check at 1440px and 375px in both themes, and the owner's go-ahead before merging. The backend merges and deploys before its frontend.

## 7. Testing

- **Backend.**
  - Classification on every create path, including connector sync, with the classifier stubbed.
  - Choosing the text: transcript, then summary, then title.
  - The "not analysable" state.
  - The nightly command's limit and budget stop.
  - Recompute on classify.
  - The history endpoint's privacy, using the "blind to one account" setup, the owner-only mail rule and ticket departments.
  - The list filters and summary, with a pinned query count.
  - Ask surface privacy and snapshots, in delivery 2.
- **Frontend.**
  - Unit tests for the list item, the profile and the call row.
  - Integration tests through the real store and router, with `fetch` stubbed in contract shapes.
  - A jsdom end-to-end test: filter by organisation, open a person, see their calls with sentiment, follow the link to the organisation.
  - The house-rules suite over the new files.
