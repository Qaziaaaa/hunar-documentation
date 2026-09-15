# HUNAR � Worker Additional Features: UI Requirements

**Document Purpose:** Frontend/UI specification for Google Stitch  
**Scope:** Four additional Worker-side sections � Dispute, Review & Rating, Category, and Location  
**Source of Truth:** `prompt.md`, `design-prompt.md`, `colors.md`, `design.md`, `worker-workflow-mvp.md`

> **Important for Stitch:** Do not create a new design system. Apply the existing HUNAR design system defined in `design.md` and `colors.md` exactly. All colors, typography, spacing, button styles, card styles, and component patterns referenced in this document come directly from those files.

---

## Design System Reference (Summary)

All UI in this document must follow these rules already defined in the HUNAR project:

| Token | Value | Usage |
|---|---|---|
| Primary (Teal) | `#0F766E` | Primary CTAs, active states, verified badge, links |
| Primary Dark | `#115E59` | Hover state on primary buttons |
| Primary Light | `#CCFBF1` | Active pill toggles, badge highlights |
| Navy | `#0F172A` | Headings, numbers, prices, body text |
| Gray | `#64748B` | Secondary text, metadata, timestamps |
| Background | `#F8FAFC` | Page canvas |
| Surface | `#FFFFFF` | Cards, modals, forms, navbar |
| Border | `#E2E8F0` | 1px hairline dividers and card outlines |
| Success | `#16A34A` | Completed, Approved, Paid, Online |
| Warning | `#F59E0B` | Pending, Offers, Ratings/Stars, Attention |
| Error | `#DC2626` | Cancelled, Rejected, Dispute, Delete |

**Typography:** Inter font, weights 400�700. Headings use Semi-Bold with tight letter-spacing. Labels/metadata use uppercase with expanded tracking (`label-sm` style). See `design.md` for full type scale.

**Buttons:**
- Primary: Solid Teal (`#0F766E`), white text, `0.375rem` radius, no shadow. Hover ? `#115E59`.
- Secondary/Outline: White background, `1px #E2E8F0` border. Hover ? teal border + teal text.
- Destructive: White background, `1px #DC2626` border, `#DC2626` text. Hover ? light red fill.

**Cards:** White (`#FFFFFF`), `1px solid #E2E8F0` border, `0.25rem�0.5rem` radius. No heavy drop shadows.

**Status Badges:** Pill radius (`9999px`), `label-sm` uppercase. Colors match semantic token table above.

---

## Section 1 � Dispute

### Overview

A dispute is raised when a job ends in an unresolved disagreement between the worker and the customer. This can happen when:

- The customer believes the work was not completed properly.
- The worker believes the customer refuses to pay for legitimate completed work.
- There is a disagreement over scope, pricing, or quality.

The Dispute section appears in the Worker's sidebar navigation under **"My Jobs"** or as a sub-section under an active/completed job detail screen.

---

### 1.1 Entry Point � When a Dispute Can Be Raised

A dispute can be raised from the **Job Details screen** once the job has reached one of these statuses:

- `repair_approved`
- `in_progress`
- `completed` (before payment is confirmed)
- `payment_disputed`

A **"Raise Dispute"** ghost/text button appears at the bottom of the job detail screen � styled as a Secondary button with an Error (`#DC2626`) text color and border. It must never be the primary CTA on that screen.

**Button label:** `Raise a Dispute`  
**Position:** Below all primary job actions, separated by a hairline divider (`1px solid #E2E8F0`).

---

### 1.2 Raise Dispute � Modal / Sheet

When the worker taps "Raise a Dispute", display a **bottom sheet or modal overlay** (not a new page).

**Modal structure:**

- **Title:** `Raise a Dispute` (headline-sm, `#0F172A`)
- **Subtitle:** `Describe the issue clearly. Admin will review the case and contact both parties.` (body-sm, `#64748B`)
- **Divider** (`1px solid #E2E8F0`)

**Form fields inside the modal:**

1. **Dispute Reason** � Dropdown / Select  
   Label: `Reason for Dispute`  
   Options:
   - Customer refusing to pay
   - Customer made false claims
   - Scope of work disagreement
   - Quality dispute raised by customer
   - Other

2. **Description** � Textarea  
   Label: `Describe the issue`  
   Placeholder: `Provide a clear description of the problem...`  
   Character limit: 500 characters  
   Show live character count (e.g., `0 / 500`) in `label-sm`, `#64748B`

3. **Supporting Evidence** � Optional file upload  
   Label: `Attach Photos or Documents (Optional)`  
   Sub-label: `Max 5 files. Supports JPG, PNG, PDF.`  
   Upload area: dashed border (`1px dashed #CBD5E1`), centered icon + text  
   After upload: show thumbnail grid with individual remove buttons

**Actions:**
- Primary CTA: `Submit Dispute` � Teal button, full-width inside modal
- Secondary: `Cancel` � Ghost/text button, centered below primary

**Submission behavior:** Show an inline loading state on the button. On success, close modal and show a **toast notification**: `"Your dispute has been submitted. Admin will review within 24 hours."` (Success toast � green `#16A34A` left border).

---

### 1.3 Active Dispute � Status Banner on Job Card

Once a dispute is submitted, the job card in **"My Jobs"** must display a status banner:

- Background: light red (`#FEF2F2`)
- Left border accent: `3px solid #DC2626`
- Icon: warning or shield-alert icon in `#DC2626`
- Label: `Dispute Under Review` � `label-sm`, uppercase, `#DC2626`

The job status badge updates to: **`Disputed`** � pill badge, red tint background, red text.

---

### 1.4 Dispute Detail Screen

When the worker taps on a disputed job to view its details, display a dedicated **Dispute Status Section** within the existing job detail screen (not a separate page).

**Section header:** `Dispute Status` (headline-sm)  
**Visual treatment:** White card with `1px solid #E2E8F0` border, `0.5rem` radius, `1.5rem` padding

Content inside:
- **Status chip:** e.g., `Under Review` / `Resolved � Worker Favored` / `Resolved � Customer Favored`
- **Submitted on:** Date and time (body-sm, `#64748B`)
- **Reason:** The reason selected during submission
- **Your Description:** Text preview with expand option if long
- **Attached Files:** Thumbnail row with view/download option
- **Admin Message (if any):** Displayed as a distinct quoted block with a gray left border (`3px solid #CBD5E1`)

**Resolved State:** When the dispute is resolved, the banner changes:
- If worker-favored: Green banner (`#16A34A`), label: `Dispute Resolved � Payment Released`
- If customer-favored: Orange banner (`#F59E0B`), label: `Dispute Resolved � See Admin Decision`

---

### 1.5 Disputes List � "My Disputes" Sub-Section

Accessible from **Worker sidebar ? My Jobs ? Disputes tab** or as a dedicated nav entry.

Display as a list of rows (not heavy cards). Each row:
- Left: Job title + category icon
- Center: Dispute reason (truncated if long) + submission date
- Right: Status badge pill

**Empty state:**  
Icon: document-check  
Heading: `No Disputes`  
Sub-text: `You have no active or past disputes.`  
(No CTA button � disputes are only raised from individual jobs)

---

## Section 2 � Review & Rating

### Overview

After a job is completed and paid, both the customer and worker can leave a review. This section covers the **Worker's experience** of:

1. Receiving a review from a customer (read-only)
2. Leaving a review for a customer (write)
3. Viewing their own rating profile summary

This section is accessible from **Worker sidebar ? Reviews**.

---

### 2.1 Worker's Reviews Screen

**Screen title:** `Reviews` (headline-md)  
**Sub-title:** `{N} total reviews � avg_rating average` (body-md, `#64748B`)

**Layout:**
- Top: Rating Summary Card
- Below: Reviews list (most recent first)

---

### 2.2 Rating Summary Card

A single prominent card at the top of the Reviews screen.

**Card contents:**
- Large average rating number � e.g., `4.9` � displayed in headline-lg, `#0F172A`
- Star row (5 stars): filled stars in Orange (`#F59E0B`), empty stars in `#E2E8F0`
- Total reviews count: e.g., `Based on 127 reviews` (body-sm, `#64748B`)
- Star distribution bar chart (optional but recommended):
  - 5 stars: bar showing percentage of 5-star reviews
  - 4 stars: bar showing percentage of 4-star reviews
  - 3 stars: bar showing percentage of 3-star reviews
  - etc.
  - Bars use Teal (`#0F766E`) fill on `#E2E8F0` background track

**Card style:** White surface, `1px solid #E2E8F0` border, `0.5rem` radius, `1.5rem` padding.

---

### 2.3 Individual Review Card

Each review in the list is displayed as a connected row (not an isolated elevated card):

- Full-bleed row with `1px border-b #E2E8F0`
- Vertical padding: `1.5rem`

**Row content:**

- Customer Avatar (40px circle, initials fallback with teal bg + white text)
- Customer Name: body-md, Semi-Bold, `#0F172A`
- Star rating icons: Orange `#F59E0B`
- Date: label-sm, `#64748B`, right-aligned
- Job category: label-sm, `#64748B` (e.g., `AC Repair`)
- Review text: body-sm, `#0F172A`, max 3 lines with "Read more" expand
- Quality tags: Pill chips � white bg, `1px solid #E2E8F0`, `label-sm` text in `#64748B`

---

### 2.4 Leave a Review for Customer � Worker-Side Form

After a job moves to `job_paid` or `completed` status, the worker is prompted to leave a review for the customer.

**Entry point:** A banner at the top of the completed job detail screen:

- Background: `#CCFBF1` (Primary Light)
- Text: `"You can now rate this customer. Tap to leave a review."` (body-sm, `#0F172A`)
- CTA: `Rate Customer` � Teal ghost/text button, right-aligned

**Rate Customer � Sheet/Modal:**

- **Title:** `Rate this Customer` (headline-sm)
- **Customer name shown** (body-md, `#0F172A`)
- **Star Selector:** 5 interactive star icons in Orange (`#F59E0B`)
  - Tap to select; selected stars are filled, unselected are outlined
  - Stars animate softly on selection (scale briefly to 1.1)
- **Optional Tags:** Multi-select chips (max 3 selectable)
  - Options: `Courteous`, `Prompt Payment`, `Accurate Description`, `Respectful`, `Flexible`
  - Selected chip: Teal border + Teal text + `#CCFBF1` background
  - Unselected: White + `1px #E2E8F0` border
- **Optional Comment:** Textarea (body-sm), placeholder: `Leave a comment (optional)...`, 250 char max
- **Submit CTA:** `Submit Review` � Primary Teal button, full-width
- **Skip link:** `Skip for now` � Ghost text, centered, `#64748B`

**After submission:** Toast: `"Review submitted successfully."` (Success, green).

---

### 2.5 Review Received � Notification & Display

When the customer submits a review on the worker:

- Worker receives an **in-app notification**: `"[Customer Name] left you a 5-star review."`  
  Clicking the notification navigates to the Reviews screen.
- The new review appears at the top of the reviews list.
- The rating summary card recalculates and updates the average and star distribution.

---

### 2.6 Empty State � No Reviews Yet

Icon: star-outline  
Heading: `No Reviews Yet`  
Sub-text: `Reviews will appear here after completing jobs.`  
(Matches the empty state copy pattern from `prompt.md` Section 28)  
No CTA button.

---

## Section 3 � Category

### Overview

The Category section governs how a worker defines and manages the **service categories and skills** they offer. This is part of the **Worker Profile Setup** (onboarding) and is also editable from the **Worker Profile Settings** at any time.

This section appears in:
1. **Onboarding Step:** "Select Skills & Categories" (during registration)
2. **Worker Profile ? Edit Profile ? My Services** (post-onboarding)

---

### 3.1 Onboarding � Select Skills & Categories Screen

**Screen title:** `What services do you offer?` (headline-md)  
**Sub-title:** `Select all that apply. You can update this later.` (body-sm, `#64748B`)

**Category grid layout:**
- 2-column grid on mobile, 3-column on desktop
- Each category displayed as a card:
  - White background (`#FFFFFF`)
  - `1px solid #E2E8F0` border, `0.5rem` radius
  - Light Teal icon background (`#CCFBF1`) + Teal icon (`#0F766E`)
  - Category name below icon (body-md, Semi-Bold, `#0F172A`)
  - Padding: `1.5rem 1rem`
  - **Selected state:** Teal border (`2px solid #0F766E`), `#CCFBF1` background, white checkmark badge in top-right corner

**Available Categories (from `prompt.md`):**
- AC Repair
- Plumbing
- Electrician
- Carpenter
- Appliance Repair
- Painter
- Cleaning
- Other

> **Do NOT** give each category its own unique color. All categories use the same teal icon treatment on white background, as defined in `design-prompt.md`: *"Category cards: all white with light-teal icon background + teal icon + navy name + gray description. Do NOT give each category its own color."*

**Selection behavior:**
- Multiple selections allowed (worker can serve multiple categories)
- At least one category must be selected to proceed
- Error state if proceeding with zero selections: `"Please select at least one service category."` � inline error below the grid, `#DC2626`, body-sm

**CTA:** `Continue` � Primary Teal button, full-width at bottom of screen

---

### 3.2 Sub-Skills / Specializations (Per Category)

After selecting a category, the worker optionally specifies sub-skills within that category.

Example for **AC Repair:**
- Installation
- Gas Refilling
- Servicing & Cleaning
- Compressor Repair
- Thermostat Repair

**UI treatment:** Secondary pill chip list (multi-select), horizontally scrollable or wrapped. Same chip styling as other multi-selects: White + `1px #E2E8F0` border; Selected ? Teal border + Teal text + `#CCFBF1` fill.

This step is presented as a collapsible sub-section beneath each selected main category card.

---

### 3.3 Edit Categories � Worker Profile Settings

From **Worker Profile ? My Services**, the worker can:
- Add new categories
- Remove existing ones (at least one must remain)
- Add/remove sub-skills per category

**Layout:** Same category grid as onboarding, with currently-selected categories pre-filled in their selected state.

**Save action:** `Save Changes` � Primary Teal button  
**Confirmation:** Toast notification: `"Your service categories have been updated."` (Success, green)

**Removal warning:** If removing a category that has active job offers, show an inline warning:  
`"You have an active offer in this category. Removing it will not affect your ongoing jobs."` � body-sm, `#F59E0B` (Warning orange), with warning icon.

---

### 3.4 How Categories Affect Job Discovery � Info Banner

Shown once during onboarding and accessible via a tooltip/info icon on the Categories settings screen:

> `"Workers only receive job requests that match their registered categories and service area. Keep your categories accurate to see the most relevant jobs."`

Display as a subtle info banner:
- Background: `#EFF4FF` (Surface Container Low from `design.md`)
- Left border: `3px solid #0F766E`
- Text: body-sm, `#0F172A`
- Dismissible with an X icon

---

## Section 4 � Location

### Overview

The Location section allows the worker to define and manage **where they are willing to work**. This is used by the platform to match the worker to relevant nearby jobs.

Location appears in:
1. **Worker Onboarding:** "Add Service Areas" step
2. **Worker Dashboard:** Current location / Online status context
3. **Worker Profile Settings:** Edit service area

---

### 4.1 Onboarding � Add Service Area Screen

**Screen title:** `Where do you work?` (headline-md)  
**Sub-title:** `Set your service area so customers nearby can find you.` (body-sm, `#64748B`)

**Components on screen:**

**1. City / Area Search Field**
- Label: `Your City or Area`
- Input style: White fill, `1px solid #E2E8F0` border, `0.375rem` radius, padding `0.75rem 1rem`
- Focus state: Teal border + light teal focus ring (as defined in `design.md`)
- Placeholder: `e.g., F-10, Islamabad`
- Supports text search with dropdown suggestions (city/sector names)

**2. Map View (simplified)**
- Display a map pin on a simplified area map
- Worker can drag the pin to adjust their base location
- Map container: White surface, `1px solid #E2E8F0` border, `0.5rem` radius
- Map is secondary/supportive � the text input is the primary input method

**3. Service Radius Selector**
- Label: `How far are you willing to travel?`
- UI: Horizontal slider or segmented button group
- Options: `2 km � 5 km � 10 km � 20 km � 30 km+`
- Selected value displayed in Teal: e.g., `Currently set to: 10 km`
- Segmented button: Selected segment ? Teal background + white text; Unselected ? white + gray text

**4. Multiple Service Areas (Optional)**
- Worker can add more than one service area (e.g., two different cities)
- "Add Another Area" link � ghost text button with + icon, `#0F766E` color
- Each added area displayed as a chip with a remove button
- Max: 5 service areas

**CTA:** `Continue` � Primary Teal button, full-width

---

### 4.2 Current Location / Online Status (Worker Dashboard)

On the **Worker Dashboard**, the worker's current location context is displayed as part of their status bar:

**Location Status Row:**
- Icon: Location pin (Teal `#0F766E`)
- Text: `Serving: F-10, Islamabad � 10 km radius` (body-sm, `#64748B`)
- Edit link: `Change` � Teal text, inline next to the info

This row sits directly below the **Online / Offline toggle** at the top of the Worker Dashboard, as referenced in `worker-workflow-mvp.md` (Section 5, UI Screen Checklist, Dashboard).

---

### 4.3 Edit Service Area � Worker Profile Settings

From **Worker Profile ? My Location**, the worker can update their service area.

**Layout:** Same components as onboarding (search field + map + radius selector + multiple areas).

**Save action:** `Save Location` � Primary Teal button  
**Confirmation:** Toast: `"Your service area has been updated."` (Success, green)

**Unsaved changes warning:** If worker navigates away with unsaved edits, show a confirmation modal:
- Title: `Unsaved Changes`
- Body: `"You have unsaved location changes. Are you sure you want to leave?"`
- Buttons: `Stay` (Primary Teal) | `Discard Changes` (Secondary outline)

---

### 4.4 Location Context in Job Cards (Worker View)

On the **Nearby Jobs** feed (Worker Dashboard), each job card displays location information:

- **Distance from worker:** `2.1 km away` � body-sm, `#64748B`, with location icon
- **General area name:** `F-10, Islamabad` � body-sm, `#0F172A`
- **Exact address** is hidden until the visit is confirmed (as defined in `worker-workflow-mvp.md`, Step 4)

After visit confirmation, the exact address and customer contact are revealed inside the **Active Job** detail screen.

---

### 4.5 Location Error States

Consistent with error states defined in `prompt.md` (Section 29):

| Situation | Error Message | Display Method |
|---|---|---|
| No location entered | `"Please enter your service area."` | Inline field error |
| GPS/location access denied | `"Unable to access location. Please enter your area manually."` | Inline banner below map |
| Area not found | `"Area not found. Try a different location or city name."` | Inline dropdown message |

Error text color: `#DC2626` (Error), body-sm. Paired with an inline error icon.

---

## Navigation Placement Summary

These four sections integrate into the Worker's existing navigation as follows (extending the list defined in `prompt.md`, Section 26 � Worker Navigation):

| Section | Navigation Location |
|---|---|
| **Dispute** | Worker sidebar ? My Jobs ? (Disputes tab on job detail) |
| **Review & Rating** | Worker sidebar ? Reviews (already listed in nav) |
| **Category** | Worker sidebar ? Profile ? My Services |
| **Location** | Worker sidebar ? Profile ? My Location |

The sidebar navigation items **Profile** and **Reviews** already exist per the HUNAR spec. **Dispute** and the Category/Location sub-sections are accessible from within existing screens � no new top-level nav items are required.

---

## Shared UI Behaviors

These behaviors apply across all four sections and are consistent with the existing HUNAR design system:

- **Loading states:** Primary buttons show a spinner inside them during async operations. Do not disable unrelated UI during loading.
- **Toast notifications:** All success and error messages use toast notifications appearing at the top-right of the screen (desktop) or top-center (mobile). Duration: 4 seconds. Success = green left border, Error = red left border.
- **Modals / Bottom Sheets:** All secondary actions (dispute form, review form, confirm dialogs) use modals on desktop and bottom sheets on mobile. Overlay backdrop: `rgba(15, 23, 42, 0.4)`.
- **Empty States:** Never leave a section blank. Each section above defines its own empty state copy consistent with `prompt.md` Section 28.
- **Responsive:** All screens follow the 12-column desktop grid (max `1200px`) collapsing to single-column mobile layout with `16px` lateral padding, as defined in `design.md`.
