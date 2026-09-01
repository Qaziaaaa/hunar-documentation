# Peshawar Skilled Worker Platform

## Project Requirements Documentation

**Skilled Worker Platform**

**Peshawar • BRD • PRD • User Requirements • Functional Requirements • MVP**

---

## THE PROBLEM

Customers struggle to find suitable skilled workers quickly.

## THE SOLUTION

A simple platform connecting customers with skilled workers.

## THE MVP

Find worker → Send request → Worker responds → Track request.

## USERS

Customer • Skilled Worker • Admin

> **How to present:** Each section has a large numbered banner. First say the section name, then explain the few points underneath.

---

## 01 — QUICK MAP

**The whole task in one page.**

| STAGE | SECTION | MAIN QUESTION |
|---|---|---|
| 01 | BRD | Why does the business need this? |
| 02 | PRD | What product should we build? |
| 03 | Customer Requirements | What does the customer need? |
| 04 | Worker Requirements | What does the worker need? |
| 05 | Admin Requirements | What does the admin need? |
| 06 | Functional Requirements | What must the system do? |
| 07 | MVP Scope | What are we building first? |
| 08 | Workflow & Quality | How does it work and what standards apply? |

**Remember:** WHY → WHAT → WHO → WHAT EXACTLY → FIRST VERSION → HOW IT WORKS.

---

## 02 — BRD — Business Requirements

**WHY is the business building this platform?**

### Problem

Customers often depend on contacts, referrals or repeated phone calls to find skilled workers. This can be slow and uncertain. Skilled workers may have skills but limited access to customers.

### Business Opportunity

Create a local marketplace where customers can discover service providers and workers can receive structured job opportunities. Start in Peshawar, validate the model, then expand.

### Business Goals

- Make worker discovery faster and easier.
- Give workers a digital source of customer requests.
- Build trust through profiles, verification and reviews over time.
- Validate the business model before adding complex features.

### Stakeholders

| WHO | WHY |
|---|---|
| Customer | Find a suitable worker. |
| Skilled Worker | Get relevant customers. |
| Admin | Keep the platform safe and organized. |
| Business Team | Validate demand and grow. |

---

## 03 — PRD — Product Requirements

**WHAT product are we going to build?**

### Product Vision

A simple and trusted platform where customers can find the right skilled worker, send a service request and clearly track what happens next.

### Product Goals

- Easy worker discovery.
- Clear worker profiles.
- Simple service requests.
- Clear worker response and status.
- Basic admin control.

### Three Main Users

#### CUSTOMER

Find workers and request a service.

#### SKILLED WORKER

Show services and manage requests.

#### ADMIN

Manage users, workers and activity.

### MVP Boundary

Focus on worker discovery + service request + request management. Payments, AI and a large materials marketplace come later.

---

## 04 — Customer Requirements

**WHAT does the customer need?**

### Customer Journey

Register → Choose Service → Search → View Worker → Send Request → Track Status

### Customer Requirements

- Create account and log in.
- Choose a service category.
- Search and filter workers.
- View worker profile and service information.
- Send request with job details and location.
- See request status.
- Cancel request when allowed.
- View previous requests.

### Simple Explanation

The customer should think: “I need a service → I find someone relevant → I send a request → I know the status.”

---

## 05 — Skilled Worker Requirements

**WHAT does the worker need?**

### Worker Journey

Register → Create Profile → Add Services → Receive Request → Accept/Reject → Update Status

### Worker Requirements

- Create account and log in.
- Create and edit professional profile.
- Select service categories and skills.
- Add service area/location.
- Set availability.
- Receive customer requests.
- Accept or reject requests.
- Update request/job status.
- View active and completed requests.

### Simple Explanation

The worker should think: “My skills are visible → customers can find me → I manage my requests.”

---

## 06 — Admin Requirements

**WHAT does the admin need?**

- Secure admin login.
- View and manage customers.
- View and manage workers.
- Review worker profiles.
- Create, edit or disable service categories.
- Monitor service requests.
- Handle reports or complaints.
- Suspend/deactivate problematic accounts.
- View basic platform statistics.

### Admin’s Main Job

Control the marketplace, keep information organized and maintain trust.

---

## 07 — Functional Requirements

**WHAT exactly must the software do?**

| ID | THE SYSTEM MUST... | SCOPE |
|---|---|---|
| FR-01 | Register customers and workers. | MVP |
| FR-02 | Log users in/out and enforce roles. | MVP |
| FR-03 | Create and update worker profiles. | MVP |
| FR-04 | Manage service categories. | MVP |
| FR-05 | Search and filter workers. | MVP |
| FR-06 | Display worker profile information. | MVP |
| FR-07 | Create a service request. | MVP |
| FR-08 | Store customer, worker, service and request details. | MVP |
| FR-09 | Show new requests to workers. | MVP |
| FR-10 | Let workers accept/reject requests. | MVP |
| FR-11 | Maintain request statuses. | MVP |
| FR-12 | Let customers view status/history. | MVP |
| FR-13 | Give admin user/worker/category controls. | MVP |
| FR-14 | Suspend/deactivate accounts. | MVP |
| FR-15 | Record important request actions. | MVP |
| FR-16 | Support ratings/reviews. | LATER |
| FR-17 | Support customer-worker chat. | FUTURE |
| FR-18 | Support online payments. | FUTURE |

> **Easy meaning:** Functional requirements are simply the list of things the software must be able to do.

---

## 08 — MVP — Minimum Viable Product

**WHAT are we building FIRST?**

### MVP Goal

Prove that customers can find suitable workers and workers can respond to real service requests.

### Build First

| BUILD FIRST | WHY |
|---|---|
| Customer registration/login | Customers can enter the platform. |
| Worker registration/login | Workers can join. |
| Worker profile | Customers can understand the worker. |
| Service categories | Customers can find the right service. |
| Search/filter | Customers can discover relevant workers. |
| Service request | Customers can ask for a service. |
| Accept/reject | Workers can respond. |
| Request status | Both sides know what is happening. |
| Admin controls | Platform can be managed. |

### NOT IN THE FIRST RELEASE

Advanced AI • Online payments • Subscriptions • Large material marketplace • Complex analytics • Multi-city expansion

---

## 09 — Workflow & Quality

**HOW does the system work?**

### Workflow

| STEP | ACTION |
|---:|---|
| 1 | Customer or worker registers. |
| 2 | Worker creates profile and adds services. |
| 3 | Customer chooses a service. |
| 4 | Customer searches and views workers. |
| 5 | Customer sends a service request. |
| 6 | Worker accepts or rejects. |
| 7 | Accepted request moves through status updates. |
| 8 | Job is completed and recorded. |

### Quality Requirements

- **Security:** protect accounts and restrict access by role.
- **Performance:** common actions should respond quickly.
- **Usability:** main flow should be easy without training.
- **Responsive:** work on mobile, tablet and desktop.
- **Data integrity:** requests and user data stay consistent.
- **Maintainability:** future modules can be added safely.

---

## 10 — Final Presentation Summary

**THE WHOLE PROJECT IN ONE PAGE.**

| TOPIC | SIMPLE EXPLANATION |
|---|---|
| BRD | We identified the business problem and why the platform is needed. |
| PRD | We defined what product we are going to build. |
| Customer | Customers need an easy way to find and request skilled workers. |
| Worker | Workers need profiles, requests and simple job management. |
| Admin | Admin needs control over users, workers, categories and activity. |
| Functional Requirements | The system must support accounts, discovery, requests, responses and management. |
| MVP | Build the core workflow first and validate real demand. |
| Workflow | Register → Discover → Request → Respond → Track → Complete. |

### CORE IDEA

Find the right skilled worker. Send a request. Manage the job clearly.

**Document status:** Requirements baseline for MVP planning.

---

## Source Preservation Note

This Markdown document is a structured transcription of the uploaded 11-page PDF. The terminology, sequence, requirements, scope labels, workflows, explanations, and summary statements from the source have been preserved rather than replaced with outside assumptions.