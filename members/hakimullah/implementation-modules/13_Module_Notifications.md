# Module 13 — Notifications

## 1. What this module is

This module is the platform's **alarm system**. Whenever something important happens,
it tells the right person — on the screen (in-app), by push to their browser/device,
and by SMS for critical messages.

It is **event-driven**: business events from other modules trigger notifications.
The other modules do not need to know all the ways a user can be reached.

## 2. Why we build it

- A customer needs to know instantly when an offer arrives.
- A worker needs to know instantly when a matching job appears nearby.
- Nobody should have to refresh the page to see what changed.
- Critical events (OTP, payment, verification result) must not be missed.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer / Worker | Receive notifications; manage preferences; mark read |
| System | Sends notifications automatically on events |
| Admin | Sees platform-level alerts; may send official messages |

## 4. The notification channels (all optional per platform design)

| Channel | Typical use |
|---|---|
| In-app | Stored notification list with read/unread; always available |
| Push (browser/device) | New jobs, offers, messages, payment — near real time |
| SMS | OTP codes and critical alerts |

## 5. Main screens / features

- **Notification bell / list** — recent notifications with icons and time.
- **Unread count badge** — shown on the dashboard.
- **Mark read / mark all read.**
- **Notification preferences** — the user can choose which types of alerts they want (e.g. promotional off).
- **In-app navigation** — tapping a notification opens the related record (job, offer, booking).

## 6. The notification events list (built from the whole workflow)

| Event | To whom | Channels |
|---|---|---|
| OTP code sent | the user | SMS (+push) |
| New matching job | eligible workers | push + in-app |
| New offer on your job | the customer | push + in-app |
| Offer withdrawn | the customer | in-app |
| Offer selected | the worker | push + in-app |
| Booking confirmed | both | push + in-app |
| Visit reminder (e.g. 24h before) | both | push |
| Worker arrived | the customer | push + in-app |
| Repair estimate submitted | the customer | push + in-app |
| Estimate approved | the worker | push + in-app |
| Job completed | the customer | push + in-app |
| Payment received | the worker | push + in-app |
| Job paid / payout released | the worker | push + in-app |
| New review | both | in-app |
| Verification approved/rejected | the worker | push + in-app |
| Account suspended/restored | the user | push + in-app (+ SMS optional) |
| Dispute opened/resolved | both parties | push + in-app |
| New chat message | the receiver | push + in-app |

## 7. What data this module stores

| Field | Meaning |
|---|---|
| Notification | User, type, title, message, deep-link reference, read time, created time |
| Push registration | Device/browser token per user (needed to reach them) |
| Delivery attempt log | What was sent, which channel, status (for retry decisions) |

## 8. Main workflows

### Workflow A — An event creates notifications

1. Some module performs a business action (e.g. offer selected).
2. It calls the notification service with a typed event + payload.
3. The notification service:
   - creates the in-app notification for the target user(s),
   - sends push where the user enabled it,
   - sends SMS only for the critical subset.
4. The notification list updates; the badge count grows.
5. No event means no notification — nothing is guessed.

### Workflow B — User reads notifications

1. User opens the bell → they see the list.
2. User taps one → it navigates to the record (job/offer/booking).
3. "Mark read" / "Mark all read" update the user's read state.
4. The badge count recomputes.

### Workflow C — Delivery failure handling

1. A push attempt fails (offline, disabled).
2. The in-app notification is **always** saved, so nothing is lost.
3. For critical messages, a retry/fallback (e.g. SMS) is possible per rules.
4. The log records what happened for monitoring.

## 9. Business rules (the system MUST)

1. Notifications are created only from real business events — not manual guesswork.
2. **No duplicate notifications**: the same event produces one notification per target user.
3. In-app notifications are stored in the database (permanent history).
4. Push/SMS are best-effort extra channels; the database is the source of truth.
5. Users can control which message types they receive (at minimum promotional/tactical).
6. Notifications contain safe links (deep links) — never raw malicious content.
7. Delivery logs do not contain secrets (passwords/tokens/payment details).
8. Batching is allowed for high-volume events (e.g. one "new jobs" digest) — a product choice.
9. A suspended user does not receive promotional notifications.
10. Timestamps are recorded; the list is ordered newest-first.

## 10. Edge cases the system must handle safely

- Event fires twice (double click) → duplicate protection creates one notification.
- User is offline at event time → in-app still saved; push sent when reachable (or not — still in-app).
- Push registration changed → old tokens are cleaned up; sends fail gracefully.
- User disabled all notifications → only critical SMS stays (OTP), in-app still stored.
- Thousands of workers notified for one job → batched, not same-second spam.
- Notification content references a deleted record → navigation shows a friendly "not found" safe message.

## 11. Connections to other modules

| Module | How they connect |
|---|---|
| 01 Auth & Accounts | OTP delivery (SMS); security alerts |
| 02 Profiles & Verification | Verification result alerts |
| 04–10 Workflow modules | They generate the events listed above |
| 12 Chat & Messaging | New-message events |
| 17 Admin Operations | Alert about pending verifications / disputes |
| 18 Disputes & Support | Dispute status alerts |
| 19 Security & Audit | Logs which notifications were attempted |

## 12. Definition of done

- [ ] In-app notification list + unread badge works for all core events.
- [ ] Push and SMS channels work where enabled; failures never lose the in-app copy.
- [ ] Duplicate events produce a single notification per user.
- [ ] Users can mark notifications read and control preferences.
- [ ] Tapping a notification navigates to the correct record.
- [ ] Delivery logging works and contains no secrets.
- [ ] Module 21 tests cover duplicates, offline delivery, batching, and read state.