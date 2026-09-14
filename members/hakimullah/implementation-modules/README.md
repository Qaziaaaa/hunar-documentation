# HUNAR — Implementation Modules

This folder contains the **full implementation documentation** for the HUNAR platform
(the Peshawar Skilled Worker / Home Services Marketplace).

## The Golden Rule of These Files

> **These files describe WHAT we are going to build, NOT the technology we will use to build it.**

The technology stack will be decided SEPARATELY, after this documentation is reviewed.
None of the files in this folder commit the project to any specific framework,
programming language, database product, or cloud provider. Where a technical word
appears (for example "server", "database", "API", "file storage", "push notification"),
it is used as a **concept**, not a technology decision.

## Why These Files Exist

- A junior developer should be able to read any file and understand what to build.
- The whole team should agree on what we are building before we write a single line of code.
- Each module file is a "work package" — small, clear, and testable.

## How To Read These Files

1. Start with `00_Project_Implementation_Overview.md`.
   This is the big picture: the whole project, all modules, how they connect,
   and the complete end-to-end workflow.
2. Then read any module file you are working on.
   Every module file follows the **same structure** (see below).
3. Use Module 21 (`21_Module_Testing_and_QA.md`) when you want to know
   how a module is verified, and Module 19
   (`19_Module_Security_Audit_and_Reliability.md`) for the rules every module must follow.

## The Standard Structure Of Every Module File

Every module file contains the same sections so that any team member can find
information quickly:

1. **What this module is** — one-paragraph explanation in simple words.
2. **Why we build it** — the problem it solves.
3. **Who uses it** — which roles interact with the module.
4. **Main screens / features** — what the user sees and does.
5. **Data this module stores** — the information the module must remember.
6. **Main workflows** — step-by-step flows.
7. **States and status changes** — how a record changes over time.
8. **Business rules** — the rules the system MUST follow.
9. **Edge cases** — tricky situations the system must handle safely.
10. **Connections to other modules** — how data flows in and out.
11. **Definition of done** — how we know the module is finished.

## Module List

| # | Module File | Short Description |
|---|---|---|
| 00 | `00_Project_Implementation_Overview.md` | The complete project implementation overview |
| 01 | `01_Module_Authentication_and_Accounts.md` | Registration, login, OTP, roles, sessions |
| 02 | `02_Module_User_Profiles_and_Verification.md` | Customer/worker profiles, verification, settings |
| 03 | `03_Module_Service_Categories.md` | Service categories and worker skills |
| 04 | `04_Module_Job_Posting.md` | Creating a service request / job |
| 05 | `05_Module_Job_Discovery_and_Matching.md` | Search, filter, and matching workers |
| 06 | `06_Module_Offers_and_Negotiation.md` | Worker offers and price negotiation |
| 07 | `07_Module_Bookings_and_Scheduling.md` | Worker selection, booking, scheduling |
| 08 | `08_Module_Visits_Inspection_and_Repair_Estimates.md` | Visit, inspection, repair estimate |
| 09 | `09_Module_Job_Execution_and_Completion.md` | Job progress, arrival, completion |
| 10 | `10_Module_Payments_Wallet_and_Commission.md` | Payments, wallet, escrow, commission |
| 11 | `11_Module_Reviews_and_Ratings.md` | Ratings and reviews after completion |
| 12 | `12_Module_Chat_and_Messaging.md` | Customer-worker messaging |
| 13 | `13_Module_Notifications.md` | Push, SMS, and in-app notifications |
| 14 | `14_Module_Location_and_Maps.md` | Location selection, distance, maps |
| 15 | `15_Module_File_Uploads_and_Media.md` | Images, voice notes, documents |
| 16 | `16_Module_Search_and_Filtering.md` | Advanced search and filtering |
| 17 | `17_Module_Admin_Operations.md` | Admin dashboard and platform control |
| 18 | `18_Module_Disputes_and_Support.md` | Complaints, disputes, help center |
| 19 | `19_Module_Security_Audit_and_Reliability.md` | Security, audit, reliability rules |
| 20 | `20_Module_Non_Functional_Requirements.md` | Performance, usability, scalability, etc. |
| 21 | `21_Module_Testing_and_QA.md` | Testing strategy and quality assurance |
| 22 | `22_Module_Deployment_and_Operations.md` | Environments, deployment, monitoring |

## Suggested Reading Order For New Team Members

1. Read the PRD and BRD first (they are in the parent folder).
2. Read `00_Project_Implementation_Overview.md`.
3. Read Modules 01 → 10 in order (these form the core workflow).
4. Read Modules 11 → 18 as needed.
5. Read Modules 19 → 22 before starting any coding task.

---

*Everything in this folder is written so that even a completely new developer can
understand the project and start contributing confidently.*