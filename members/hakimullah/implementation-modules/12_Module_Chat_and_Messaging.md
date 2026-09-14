# Module 12 — Chat and Messaging

## 1. What this module is

This module lets a **customer and worker talk to each other** inside the platform —
like a built-in messenger.

The chat is **tied to the transaction**:

- a conversation is created automatically when an offer is selected / booking created (Module 07),
- both sides can discuss scheduling, location details, and the job,
- messages support text, photos, and optionally voice notes.

Keeping the conversation inside the platform means nothing important is lost —
and support can read it if needed (Modules 17/18).

## 2. Why we build it

- Customers and workers need to talk ("Is it okay if I come at 6 pm?").
- Keeping the chat in-platform protects both sides and reduces off-platform leakage.
- It makes the marketplace feel personal and reliable.

## 3. Who uses it

| Role | How they use it |
|---|---|
| Customer | Sends/receives messages with the selected worker |
| Worker | Sends/receives messages with the customer of a booking |
| Admin | Can read conversations for support/dispute investigation (with rules) |

## 4. Main screens / features

- **Conversation list** — the user's open chats with unread counts.
- **Chat screen** — bubbles, timestamps, attachments, typing indicator.
- **Attachment send** — image/voice (Module 15).
- **Unread badges** — counts shown in the dashboard.
- **Navigation from booking** — a chat opens linked to the correct booking.

## 5. Data this module stores

| Field | Meaning |
|---|---|
| Conversation | Participants, related booking, created/updated times |
| Message | Conversation, sender, type (text/photo/voice), content/reference, sent time |
| Read state | Which messages a user has read (for unread badges) |

## 6. Main workflows

### Workflow A — Conversation creation

1. An offer is selected (Module 06) → booking created (Module 07).
2. The system automatically creates a conversation between the customer and the worker.
3. Both sides see the conversation in their chat list.

### Workflow B — Sending a message

1. A participant opens the conversation.
2. They type (or attach a file) and send.
3. The message is stored (Module 15 for files).
4. The other side receives it **in real time** if connected; otherwise as soon as they connect.
5. The other side gets a notification (Module 13).

### Workflow C — Read tracking

1. Each chat list shows unread counts per conversation.
2. Opening/reading a conversation marks those messages read (for the current user).
3. Unread counts reset for that user.

## 7. States and status changes

**Conversation status:**

```
active ──► closed (booking cancelled/completed and no longer needs chat)
```

Rules:
- A closed conversation cannot receive new messages (or can be re-opened only by support).
- History is never deleted.

## 8. Business rules (the system MUST)

1. Only **participants** of a conversation can read or send messages in it.
2. A conversation is automatically created per booking, not manually.
3. No chat can exist without a related booking between the two users.
4. Messages are stored with timestamps; ordering is by time.
5. Chat history is never silently deleted.
6. Attachments use the safe upload rules of Module 15.
7. Real-time delivery is **best-effort convenience**: even if real-time fails, the message is saved and the user is notified.
8. Admins can access conversations only through a logged, justified flow (support/dispute).
9. A user cannot talk to a worker they have no booking with (prevents spam).
10. Suspended users can be blocked from chat (Module 01/17).

## 9. Edge cases the system must handle safely

- Both sides send messages simultaneously → both are saved; no lost messages.
- Network drop mid-send → retry does not create duplicate messages (client + server protection).
- User opens chat while offline → they see stored history; new messages arrive on reconnect.
- Two users trying to create a second conversation for the same booking → only one conversation allowed.
- Conversation closed but a participant tries to message → rejected with a friendly message.
- Attached file too large → rejected by Module 15 rules.
- Worker/customer booking is cancelled → conversation closes; support can still read history.
- Message contains links/abuse → flagged per Module 11-style flagging / admin handling.

## 10. Connections to other modules

| Module | How they connect |
|---|---|
| 07 Bookings & Scheduling | Booking presence drives conversation creation |
| 13 Notifications | New-message events notify the receiver |
| 15 File Uploads & Media | Attachments are stored/served here |
| 01 Auth & Accounts | Participant identity and blocking rules |
| 17 Admin Operations | Read access for support cases (logged) |
| 18 Disputes & Support | Chat history is evidence |

## 11. Definition of done

- [ ] A conversation is auto-created when a booking is made.
- [ ] Participants can exchange text messages in both directions.
- [ ] Images/voice attachments work through Module 15 rules.
- [ ] Unread counts are correct per conversation.
- [ ] Non-participants cannot read or send in a conversation.
- [ ] Message ordering and timestamps are reliable.
- [ ] Offline users receive messages when they connect and a notification is queued.
- [ ] Duplicate-message protection works on retries.
- [ ] Module 21 tests cover authorization, duplicates, reconnection, and unread counts.