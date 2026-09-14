# Module 22 — Deployment and Operations

## 1. What this module is

This module is the **operations manual** for getting the platform into users' hands and
keeping it healthy afterwards: environments, release process, monitoring, backups,
security operations, and growth planning.

## 2. Environments

| Environment | Who uses it | Purpose |
|---|---|---|
| Dev | Developers | Local/sandbox development |
| Test/Staging | QA + reviewers | Verify a release before it hits users |
| Production | Real customers/workers | Live platform |

Rules:

- Environments are fully separated (own configuration; never share secrets between them).
- Staging mirrors production configuration as closely as reasonable.
- Production access is limited to the team, with credentials kept in a secrets store,
  never in code or documentation files.

## 3. Secrets management

- No secrets in source code, repositories, or this documentation (API keys, passwords,
  payment provider callbacks, SMS gateway credentials).
- Secrets live in an environment secrets system, injected at runtime.
- A lost/leaked secret is rotated immediately and the team is informed.

## 4. Release process (how new features reach users)

```
develop   →   test (QA)   →   production
```

1. Code changes are merged into the development branch.
2. Changes are deployed to the Test environment; automated tests run (Module 21).
3. QA does the release-gate checks (Module 21 section 7).
4. Production deployment happens from a known-good release.
5. A new version is identifiable (version label) so debugging is easy.

Rollback plan (part of step 4): every release has a known earlier good version to
return to quickly if something breaks.

## 5. Monitoring and health

- **Health check** endpoint tells us the core service is alive and its databases are
  reachable.
- **Alerts** are triggered automatically for: service down, high error rate, slow
  response, and payment failures.
- **Dashboards** show: traffic, request errors, average response time, active users,
  active jobs, successful/failed payments, wallet balance totals.
- **Incident process:** anyone who spots a problem opens a ticket (Module 18-style),
  and the team investigates from logs (Module 19) without panicking.

## 6. Backups and data protection

- Databases are backed up on a schedule (daily or closer as team decides).
- Backups are tested for restorability (a restore that was never rehearsed is not a backup).
- Uploaded files (Module 15) are backed up/restorable too.
- Backups are stored away from the main servers so a single failure cannot destroy both.
- Retention aligns with Pakistani data/privacy expectations (details with the product owner).

## 7. Security operations

- Every deploable release re-runs the security checklist (Module 19 section 8).
- Dependency updates are applied on a schedule, with the critical ones prioritized.
- Unusual activity (brute force spikes, unusual payment patterns) is spotted through
  alerts and investigated.
- User data privacy is respected in ops processes: access to production data is
  need-to-know and logged.

## 8. Operational playbooks (short, plain-language what-to-do guides)

| Situation | Quick actions |
|---|---|
| Service down | Check health + logs; restart known steps; if needed, rollback to previous released version |
| Payment provider failing | Communicate status to users ("payments temporarily unavailable"), monitor, enable again when healthy |
| High error rate after release | Suspect newest release; roll back; investigate from logs |
| Backup restore needed | Restore from the latest verified backup into isolation first, then switch service |
| Security incident | Isolate, preserve logs, contain, report to team leads, rotate secrets, document |

Keep these as living documents next to the code, not here in theory — the team writes them
specifically for the actual setup they choose.

## 9. Growth planning (what we prepare, not what we buy)

- The modular design (concept) allows splitting a hotspot (e.g. notifications or search)
  into its own service later without redesign.
- Databases should make the hot paths lookups fast: identity, matching queries, booking
  participants, payment references.
- Capacity reviews happen when sustained growth shows (the team watches dashboards).

## 10. Definition of done

- [ ] Dev / Test / Production environments exist with separated configuration.
- [ ] Secrets are stored outside code/documentation and injected at runtime.
- [ ] A documented, repeatable release process with rollback plan exists.
- [ ] Health checks, alerts, and dashboards are active.
- [ ] Scheduled backups run and are restorable (tested).
- [ ] Security checklist part of every release.
- [ ] Operational playbooks exist next to the code for the chosen setup.
- [ ] Module 21's release gate is followed.