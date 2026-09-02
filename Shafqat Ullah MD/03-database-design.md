# Database Design Proposal — Home Services Platform (MERN / MongoDB)

**Author:** Shafqat Ullah  
**Document Type:** Database Design Proposal  
**Version:** 2.0  
**Date:** September 2, 2026  
**Status:** Draft — Pending Team Review

> **Note:** This is a **MERN-stack website** (MongoDB, Express, React, Node.js). The database is **MongoDB** using **Mongoose** as the ODM. Collections and Mongoose schemas below replace the SQL tables from the previous version.

---

## 1. Overview

This document proposes the complete MongoDB database design including collection choice, schema design, indexing strategy, backup, and performance considerations for the Home Services Platform.

---

## 2. Database Technology Selection

| Criteria | PostgreSQL | MySQL | **MongoDB** |
|---|---|---|---|
| ACID Compliance | ✅ Full | ✅ Full | ✅ (document-level transactions) |
| Geospatial (GIS) | ✅ PostGIS | ⚠️ Basic | ✅ Native `2dsphere` / GeoJSON |
| JSON Support | ✅ JSONB | ⚠️ JSON | ✅ Native (BSON documents) |
| Full-text Search | ✅ Built-in | ✅ Built-in | ✅ `$text` index + Atlas Search |
| Complex Joins | ✅ Excellent | ✅ Good | ⚠️ References / `$lookup` |
| Maturity / Ecosystem | ✅ Excellent | ✅ Excellent | ✅ Good |
| Schema Flexibility | ❌ Rigid | ❌ Rigid | ✅ Flexible / dynamic |
| Scalability | ✅ Replicas | ✅ Replicas | ✅ Native horizontal (sharding) |

### Decision: MongoDB

**Reasons:**
- **MERN alignment** — MongoDB is the "M" in MERN, pairs naturally with Node.js/Express and JavaScript objects (via Mongoose)
- **Native geospatial** — built-in `2dsphere` index + `$geoNear` for nearby-worker matching
- **Flexible schema** — job/worker/negotiation data fits JSON documents naturally (arrays, nested objects)
- **Single language across stack** — JavaScript/TypeScript everywhere reduces complexity and hiring burden
- **MongoDB Atlas** — managed hosting with free tier, automatic scaling, built-in monitoring

---

## 3. Additional Data Stores

| Store | Purpose | Why |
|---|---|---|
| **Redis** | Session cache, OTP storage, rate limiting, Socket.IO adapter, real-time pub/sub | Speed, TTL support, pub/sub |
| **MongoDB Atlas Search** | Advanced job search, worker search, full-text + geo combined queries | Optional upgrade from `$text` |
| **AWS S3 / Cloudinary** | Image, voice note, document file storage | Scalable, CDN-integrated |

---

## 4. Collection Design (Mongoose Schemas)

### 4.1 Collection: users

```js
const userSchema = new mongoose.Schema({
  phone:      { type: String, required: true, unique: true },   // E.164 format
  email:      { type: String, sparse: true },
  name:       { type: String, required: true },
  role:       { type: String, enum: ['customer', 'worker', 'admin', 'super_admin'], default: 'customer' },
  avatar_url: { type: String },
  password_hash: { type: String },                              // optional, for email login
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }            // [lng, lat]
  },
  is_active:   { type: Boolean, default: true },
  is_verified: { type: Boolean, default: false },
  push_sub:    { type: Object },                                // Web Push subscription
  last_login_at: { type: Date },
  created_at:  { type: Date, default: Date.now },
  updated_at:  { type: Date, default: Date.now }
});

userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ location: '2dsphere' });       // geospatial
userSchema.index({ is_active: 1 });
```

### 4.2 Collection: worker_profiles

```js
const workerProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  skills:       { type: [String], default: [] },              // skill/category IDs
  experience_years: { type: Number, default: 0 },
  bio:          { type: String },
  hourly_rate:  { type: Number },
  is_verified:  { type: Boolean, default: false },
  verification_doc_url: { type: String },
  verification_notes:   { type: String },
  rating_avg:   { type: Number, default: 0 },
  rating_count: { type: Number, default: 0 },
  total_jobs:   { type: Number, default: 0 },
  total_earnings: { type: Number, default: 0 },
  is_available: { type: Boolean, default: true },
  service_radius_km: { type: Number, default: 10 },
  service_location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  verified_at:  { type: Date },
  created_at:   { type: Date, default: Date.now },
  updated_at:   { type: Date, default: Date.now }
});

workerProfileSchema.index({ skills: 1 });
workerProfileSchema.index({ is_verified: 1 });
workerProfileSchema.index({ is_available: 1 });
workerProfileSchema.index({ rating_avg: -1 });
workerProfileSchema.index({ service_location: '2dsphere' });
```

### 4.3 Collection: customer_profiles

```js
const customerProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  default_address: { type: String },
  default_location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  total_jobs_posted: { type: Number, default: 0 },
  total_spent:   { type: Number, default: 0 },
  created_at:    { type: Date, default: Date.now },
  updated_at:    { type: Date, default: Date.now }
});
```

### 4.4 Collection: service_categories

```js
const serviceCategorySchema = new mongoose.Schema({
  name:       { type: String, required: true },
  name_urdu:  { type: String },
  description: { type: String },
  icon_url:   { type: String },
  parent_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory', default: null },
  is_active:  { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

serviceCategorySchema.index({ parent_id: 1 });
serviceCategorySchema.index({ is_active: 1 });
```

### 4.5 Collection: service_requests (Jobs)

```js
const serviceRequestSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory', required: true },
  title:        { type: String, required: true },
  description:  { type: String },
  voice_note_url: { type: String },
  images:       { type: [String], default: [] },
  location: {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true }           // [lng, lat]
  },
  address:      { type: String, required: true },
  city:         { type: String, required: true },
  area:         { type: String },
  status: {
    type: String,
    enum: ['open','offers_received','offer_accepted','worker_assigned','visit_scheduled',
           'visit_in_progress','visit_completed','inspection_done','repair_negotiating',
           'repair_approved','in_progress','completed','paid','reviewed','cancelled','disputed'],
    default: 'open'
  },
  urgency:      { type: String, enum: ['low','normal','high','emergency'], default: 'normal' },
  estimated_budget: { type: Number },
  selected_worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancel_reason: { type: String },
  cancelled_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelled_at: { type: Date },
  completed_at: { type: Date },
  created_at:   { type: Date, default: Date.now },
  updated_at:   { type: Date, default: Date.now }
});

serviceRequestSchema.index({ customer_id: 1 });
serviceRequestSchema.index({ category_id: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ location: '2dsphere' });        // nearby worker matching
serviceRequestSchema.index({ city: 1, area: 1 });
serviceRequestSchema.index({ created_at: -1 });
serviceRequestSchema.index({ urgency: 1 });
```

### 4.6 Collection: job_offers

```js
const jobOfferSchema = new mongoose.Schema({
  job_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  worker_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visit_charge:       { type: Number, required: true },
  message:            { type: String },
  estimated_repair_cost: { type: Number },
  status:   { type: String, enum: ['pending','accepted','rejected','withdrawn'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// one offer per worker per job
jobOfferSchema.index({ job_id: 1, worker_id: 1 }, { unique: true });
jobOfferSchema.index({ job_id: 1 });
jobOfferSchema.index({ worker_id: 1 });
jobOfferSchema.index({ status: 1 });
```

### 4.7 Collection: visits

```js
const visitSchema = new mongoose.Schema({
  job_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offer_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'JobOffer', required: true },
  scheduled_date: { type: Date, required: true },
  actual_date:    { type: Date },
  status:    { type: String, enum: ['scheduled','in_progress','completed','cancelled','no_show'], default: 'scheduled' },
  visit_notes: { type: String },
  images:    { type: [String], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

visitSchema.index({ job_id: 1 });
visitSchema.index({ worker_id: 1 });
visitSchema.index({ scheduled_date: 1 });
visitSchema.index({ status: 1 });
```

### 4.8 Collection: repair_estimates

```js
const repairEstimateSchema = new mongoose.Schema({
  visit_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true },
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  amount:    { type: Number, required: true },
  items_breakdown: { type: [Object], default: [] },
  status:    { type: String, enum: ['proposed','countered','accepted','rejected'], default: 'proposed' },
  negotiation_history: {
    type: [{
      by: { type: String, enum: ['customer','worker'] },
      amount: Number,
      note: String,
      at: Date
    }],
    default: []
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

repairEstimateSchema.index({ visit_id: 1 });
repairEstimateSchema.index({ status: 1 });
```

**negotiation_history example:**
```json
[
  { "by": "customer", "amount": 5000, "note": "Can you reduce?", "at": "2026-09-01T10:00:00Z" },
  { "by": "worker", "amount": 4500, "note": "Final price", "at": "2026-09-01T10:30:00Z" }
]
```

### 4.9 Collection: payments

```js
const paymentSchema = new mongoose.Schema({
  job_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:       { type: Number, required: true },
  platform_fee: { type: Number, required: true },
  worker_payout:{ type: Number, required: true },
  method:       { type: String, enum: ['jazzcash','easypaisa','stripe','cash','card'], required: true },
  status:       { type: String, enum: ['pending','processing','completed','failed','refunded'], default: 'pending' },
  gateway_ref:  { type: String },
  gateway_response: { type: Object },
  paid_at:      { type: Date },
  refunded_at:  { type: Date },
  refund_reason: { type: String },
  created_at:   { type: Date, default: Date.now },
  updated_at:   { type: Date, default: Date.now }
});

paymentSchema.index({ job_id: 1 });
paymentSchema.index({ customer_id: 1 });
paymentSchema.index({ worker_id: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ gateway_ref: 1 }, { unique: true, sparse: true });
```

### 4.10 Collection: reviews

```js
const reviewSchema = new mongoose.Schema({
  job_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  reviewer_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:     { type: Number, min: 1, max: 5, required: true },
  comment:    { type: String },
  images:     { type: [String], default: [] },
  is_visible: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

// one review per reviewer per job
reviewSchema.index({ job_id: 1, reviewer_id: 1 }, { unique: true });
reviewSchema.index({ job_id: 1 });
reviewSchema.index({ reviewee_id: 1 });
reviewSchema.index({ rating: 1 });
```

### 4.11 Collection: notifications

```js
const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, required: true },
  title:   { type: String, required: true },
  body:    { type: String, required: true },
  data:    { type: Object, default: {} },
  channel: { type: String, enum: ['push','sms','in_app','email'], required: true },
  is_read: { type: Boolean, default: false },
  sent_at: { type: Date, default: Date.now },
  read_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

notificationSchema.index({ user_id: 1, is_read: 1 });
notificationSchema.index({ created_at: -1 });
notificationSchema.index({ type: 1 });
```

**Notification Types:**
- `job.new`, `job.offer_received`, `job.offer_accepted`, `job.offer_rejected`
- `visit.scheduled`, `visit.reminder`, `visit.completed`
- `repair.proposed`, `repair.negotiated`, `repair.approved`
- `payment.completed`, `review.received`
- `dispute.opened`, `dispute.resolved`
- `system.verification`

### 4.12 Collection: conversations

```js
const conversationSchema = new mongoose.Schema({
  job_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  customer_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  last_message:    { type: String },
  last_message_at: { type: Date },
  is_active:  { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

conversationSchema.index({ job_id: 1 }, { unique: true });
conversationSchema.index({ customer_id: 1 });
conversationSchema.index({ worker_id: 1 });
```

### 4.13 Collection: messages

```js
const messageSchema = new mongoose.Schema({
  conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String },
  image_url: { type: String },
  voice_url: { type: String },
  is_read:   { type: Boolean, default: false },
  created_at:{ type: Date, default: Date.now }
});

messageSchema.index({ conversation_id: 1, created_at: 1 });
```

### 4.14 Collection: disputes

```js
const disputeSchema = new mongoose.Schema({
  job_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  filed_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason:     { type: String, required: true },
  description:{ type: String, required: true },
  evidence_urls: { type: [String], default: [] },
  status:     { type: String, enum: ['open','under_review','resolved','escalated'], default: 'open' },
  resolution: { type: String },
  resolved_by:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  resolved_at:{ type: Date }
});

disputeSchema.index({ job_id: 1 });
disputeSchema.index({ status: 1 });
```

### 4.15 Collection: location_tracking

```js
const locationTrackingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }        // [lng, lat]
  },
  accuracy:   { type: Number },
  recorded_at:{ type: Date, default: Date.now }
});

locationTrackingSchema.index({ user_id: 1 });
locationTrackingSchema.index({ job_id: 1 });
locationTrackingSchema.index({ recorded_at: -1 });
locationTrackingSchema.index({ location: '2dsphere' });
```

> **Note:** This is a high-volume collection. Enable TTL index on `recorded_at` to auto-delete records older than 90 days, or archive cold data to S3/Glacier.

---

## 5. Redis Data Structures

| Key Pattern | Type | TTL | Purpose |
|---|---|---|---|
| `otp:{phone}` | String | 5 min | OTP verification |
| `session:{userId}` | Hash | 30 days | Active session data |
| `rate:{ip}:{endpoint}` | String | 1 min | Rate limiting counter |
| `job:offers:{jobId}` | Sorted Set | — | Cached offer count |
| `worker:online:{userId}` | String | 5 min (heartbeat) | Online status |
| `worker:location:{userId}` | Hash | — | Real-time worker location |
| `nearby:workers:{city}` | Geo | — | Worker geo-indexed locations |
| `socket:user:{userId}` | String | — | Socket connection mapping |
| `pubsub:job:{jobId}` | Channel | — | Real-time job updates |

---

## 6. Indexing Strategy

### 6.1 Principles

1. **Index geospatial fields** — GeoJSON fields with `2dsphere` indexes (nearby matching)
2. **Index reference fields** — ObjectId fields used in filters/`populate`
3. **Index status/enum fields** — used in WHERE filters
4. **Compound indexes** — for common query patterns (e.g., `{ user_id, is_read }`)
5. **TTL indexes** — for expiring documents (notifications, location_tracking)
6. **Unique indexes** — for identity fields (phone, gateway_ref) and one-per constraints

### 6.2 Query Patterns → Indexes

| Query Pattern | Index Needed |
|---|---|
| "Find nearby workers for job" | `2dsphere` on `worker_profiles.service_location` via `$geoNear` |
| "Find workers with skill X in area" | Index on `skills` + `2dsphere` |
| "Get open jobs in city" | Compound on `{ city, status, created_at }` |
| "Get offers for a job" | On `job_offers.{ job_id }` |
| "Unread notifications" | Compound on `{ user_id, is_read }` |
| "Worker's active jobs" | On `service_requests.{ selected_worker_id, status }` |

---

## 7. Data Retention / TTL

| Collection | Field | Strategy |
|---|---|---|
| `location_tracking` | `recorded_at` | TTL 90 days, archive to S3/Glacier |
| `notifications` | `created_at` | TTL 6 months (keep read ones archived) |
| `messages` | `created_at` | TTL 12 months, archive old conversations |
| `otp:{phone}` (Redis) | TTL | 5 min |

### 7.1 TTL Index Example

```js
// auto-delete location records after 90 days
locationTrackingSchema.index({ recorded_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
```

---

## 8. Backup & Recovery

| Strategy | Frequency | Retention |
|---|---|---|
| **MongoDB Atlas Automated Backups** | Continuous + daily snapshot | 30 days |
| **Oplog / Change Stream** | Continuous | Point-in-time recovery |
| **Manual Snapshot** | Before major deployments | 7 days |
| **Cross-Region / Cluster-Backup** | Weekly | 90 days |

### Recovery Targets

| Metric | Target |
|---|---|
| **RPO (Recovery Point Objective)** | < 5 minutes |
| **RTO (Recovery Time Objective)** | < 30 minutes |

---

## 9. Performance Considerations

### 9.1 Connection Pooling (Mongoose)

| Setting | Configuration |
|---|---|
| **Pool size** | 10 (Mongoose default), scale with load |
| **Server selection timeout** | 30 seconds |
| **Socket timeout** | 45 seconds |

### 9.2 Query Optimization

| Technique | When to Use |
|---|---|
| **Explain / `explain()`** | Every new query during development |
| **Aggregation pipeline** | Worker ratings, city stats, reporting |
| **Read preference / Read Replicas** | Separate read-heavy queries (search, analytics) |
| **Cursor pagination** | Instead of `skip` for large result sets |
| **Selective fields** | Use `.select()` to return only needed fields |

### 9.3 Caching Strategy (Redis)

| Data | Cache Duration | Invalidation |
|---|---|---|
| User profile | 5 min | On profile update |
| Service categories | 1 hour | On admin change |
| Worker ratings | 10 min | On new review |
| Nearby workers (geo) | 2 min | On location update |
| Job offer count | Real-time | On new offer |

---

## 10. Schema / Migration Strategy (Mongoose)

### 10.1 Approach: Mongoose Schemas + Data Migrations

MongoDB is schema-flexible, so **no ALTER TABLE** is required. Schema changes are handled by:
- Evolving Mongoose schema definitions
- **Mongoose versioning** (using `versionKey` / `__v`)
- **Idempotent data-migration scripts** (Node.js) for backfilling

```
scripts/migrations/
├── 20260901-init.js
├── 20260905-add-worker-profiles.js
├── 20260910-add-payments.js
└── ...
```

### 10.2 Migration Rules

1. Never modify production data in migrations without backup
2. Migrations must be idempotent (safe to re-run)
3. Test migrations on staging before production
4. Large data migrations run in background jobs
5. Add new fields with sensible defaults so existing docs remain valid

---

## 11. Seed Data

### 11.1 Service Categories (seed script)

```js
const categories = [
  { name: 'Electrical',        name_urdu: 'الیکٹریکل',         sort_order: 1 },
  { name: 'Plumbing',          name_urdu: 'پلمبرنگ',           sort_order: 2 },
  { name: 'AC & Refrigeration',name_urdu: 'ای سی اور ریفریجریٹر', sort_order: 3 },
  { name: 'Carpentry',         name_urdu: 'لکڑ کا کام',        sort_order: 4 },
  { name: 'Painting',          name_urdu: 'پینٹنگ',            sort_order: 5 },
  { name: 'Cleaning',          name_urdu: 'صفائی',             sort_order: 6 },
  { name: 'Masonry',           name_urdu: 'راج مزدوری',        sort_order: 7 },
  { name: 'Pest Control',      name_urdu: 'کیڑے مار دوا',      sort_order: 8 },
  { name: 'General Handyman',  name_urdu: 'عمومی مہارت',      sort_order: 9 }
];
await ServiceCategory.insertMany(categories);
```

---

## 12. Estimated Storage

| Collection | Estimated Docs (Year 1) | Avg Doc Size | Storage |
|---|---|---|---|
| users | 50,000 | 500 B | 25 MB |
| worker_profiles | 20,000 | 800 B | 16 MB |
| service_requests | 100,000 | 2 KB | 200 MB |
| job_offers | 300,000 | 400 B | 120 MB |
| visits | 100,000 | 600 B | 60 MB |
| payments | 100,000 | 800 B | 80 MB |
| reviews | 80,000 | 500 B | 40 MB |
| notifications | 2,000,000 | 300 B | 600 MB |
| messages | 5,000,000 | 400 B | 2 GB |
| location_tracking | 50,000,000 | 200 B | 10 GB |
| **Total** | | | **~13 GB** |

> **Note:** With TTL expiry and archival of old data, active data will be much smaller.

---

*Document prepared by Shafqat Ullah — Pending review by Qazi Farhan Ahmad (Team Lead)*
