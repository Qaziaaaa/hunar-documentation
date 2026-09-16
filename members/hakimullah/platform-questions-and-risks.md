# HUNAR Platform — Critical Questions, Risks & Mismanagement Analysis

## BUSINESS MODEL QUESTIONS

### Wallet & Commission System

1. **What happens when a worker arrives but the customer cancels on the spot?**
   - Worker already pressed "ARRIVED" and lost Rs. 500 commission
   - Is this Rs. 500 refundable? Or does the worker eat the loss?
   - What if this happens repeatedly to the same worker?

2. **What if a worker arrives but the problem is different from what was described?**
   - Customer said "AC not cooling" but actually the AC is completely dead
   - Worker still loses Rs. 500 even though the job scope changed
   - Who absorbs this cost?

3. **What if a worker arrives but cannot fix the problem?**
   - Worker presses "ARRIVED" → Rs. 500 deducted
   - Worker says "I can't fix this" → Customer pays nothing
   - Worker loses Rs. 500 + travel time + no earnings
   - Is this fair to the worker?

4. **What if multiple workers arrive for the same job?**
   - Customer posts job → 3 workers accept offers
   - All 3 show up → All 3 lose Rs. 500 each
   - Only 1 gets the job
   - Total Rs. 1500 lost by workers for 1 job

5. **What if the worker and customer agree to deal outside the platform?**
   - Worker says "Don't press ARRIVED, I'll come directly"
   - Customer saves Rs. 500 (no commission)
   - Worker saves Rs. 500 (no commission deducted)
   - Platform earns Rs. 0
   - How do you prevent this?

6. **What if the Rs. 500 commission is too high for small jobs?**
   - Customer needs a switch replaced (Rs. 200 job)
   - Worker has to pay Rs. 500 commission
   - Worker loses Rs. 300 on a Rs. 200 job
   - Why would any worker accept small jobs?

7. **What if the Rs. 500 commission is too low for large jobs?**
   - Customer needs a full house rewiring (Rs. 50,000 job)
   - Platform only earns Rs. 500
   - Is Rs. 500 enough to cover platform costs for a Rs. 50,000 transaction?

8. **What if workers tops up Rs. 500 but never gets a job?**
   - Worker adds Rs. 500 to wallet → Goes ONLINE
   - No jobs come in → Rs. 500 sits in wallet
   - Worker wants to quit → Can they get a refund?
   - What's the refund policy?

9. **What if the customer refuses to pay after work is done?**
   - Worker completes AC repair → Customer says "I don't like it"
   - Customer refuses to pay → Worker gets nothing
   - Worker already paid Rs. 500 commission
   - Worker loses Rs. 500 + time + no earnings

10. **What if the platform's commission model is not sustainable?**
    - Rs. 500 per visit is the only revenue source
    - Platform has server costs, admin costs, support costs
    - What if Rs. 500 per visit doesn't cover these costs?
    - What's the breakeven point?

### Payment & Financial Risks

11. **What if JazzCash/Easypaisa has downtime during payment?**
    - Customer tries to pay → Payment gateway is down
    - Worker completed the job but can't get paid
    - How does the platform handle payment failures?

12. **What if a customer pays but the money doesn't reach the worker?**
    - Customer pays Rs. 3000 → Platform holds money
    - 24 hours pass → Worker expects Rs. 2550
    - System error → Worker gets nothing
    - Who is responsible?

13. **What if the platform holds customer money and goes bankrupt?**
    - Customer pays Rs. 10,000 for a big job
    - Platform goes bankrupt before paying worker
    - Customer loses money, worker loses money
    - Is there insurance or protection?

14. **What if workers want to withdraw their earnings but there's a delay?**
    - Worker completes 10 jobs → Earns Rs. 25,000
    - Worker wants to withdraw → System says "Processing..."
    - How long is the delay? What if it's weeks?

15. **What if the platform wants to change the commission structure?**
    - Currently Rs. 500 per visit
    - Platform wants to increase to Rs. 750
    - Workers revolt → Leave the platform
    - How do you handle price changes?

---

## WORKER MANAGEMENT QUESTIONS

### Verification & Trust

16. **What if a worker creates multiple accounts?**
    - Worker gets banned → Creates new account with different phone number
    - Worker bypasses verification
    - How do you prevent this?

17. **What if a verified worker becomes unreliable?**
    - Worker verified → Gets good reviews initially
    - Later starts doing poor work
    - Customer complaints increase
    - How do you detect and handle this pattern?

18. **What if workers collude to manipulate ratings?**
    - 5 workers agree to give each other 5-star reviews
    - Their ratings artificially increase
    - Honest workers with lower ratings get fewer jobs
    - How do you detect fake reviews?

19. **What if workers frequently go offline during peak hours?**
    - Workers know demand is high → They go offline
    - They wait for customers to contact them directly
    - They avoid the Rs. 500 commission
    - How do you ensure worker availability?

20. **What if workers in different areas have different cost structures?**
    - Rs. 500 commission in Peshawar is reasonable
    - Rs. 500 commission in a rural area is too high
    - How do you handle regional pricing?

### Worker Behavior

21. **What if workers claim to have arrived but haven't actually arrived?**
    - Worker presses "ARRIVED" from home
    - Rs. 500 deducted → Worker keeps money
    - Customer waits → No one shows up
    - How do you verify arrival?

22. **What if workers accept jobs they can't handle?**
    - Worker accepts AC repair job → Doesn't know how to fix ACs
    - Customer wastes time → Worker wastes time
    - How do you ensure workers only accept jobs they can do?

23. **What if workers demand more money after arriving?**
    - Customer agreed to Rs. 3000 repair
    - Worker arrives → Says "Actually it's Rs. 5000"
    - Customer is trapped → Has to pay more
    - How do you prevent price gouging?

24. **What if workers damage customer property?**
    - Worker repairs AC → Breaks something else
    - Customer demands compensation
    - Worker refuses → Dispute arises
    - Who pays for the damage?

25. **What if workers have poor hygiene or unprofessional behavior?**
    - Worker shows up in dirty clothes
    - Worker is rude to customer
    - Customer complains → What's the process?
    - Can you enforce professionalism?

---

## CUSTOMER MANAGEMENT QUESTIONS

26. **What if customers create fake jobs to waste workers' time?**
    - Customer posts fake job → Worker accepts → Worker shows up
    - Customer laughs → Worker loses Rs. 500
    - How do you prevent prank jobs?

27. **What if customers harass or threaten workers?**
    - Customer becomes aggressive → Worker feels unsafe
    - Worker wants to leave → Customer won't let them
    - How do you protect workers?

28. **What if customers refuse to let workers leave?**
    - Worker arrives → Customer says "Fix it or you're not leaving"
    - Worker feels trapped → Safety concern
    - How do you handle this?

29. **What if customers provide wrong location information?**
    - Customer says "Hayatabad" → Actually lives in a remote area
    - Worker travels 30 km → Finds wrong address
    - Worker loses Rs. 500 + travel time
    - How do you verify location accuracy?

30. **What if customers use the platform to get free consultations?**
    - Customer posts job → Worker arrives
    - Customer asks for advice → Doesn't want repair
    - Worker provides free consultation → Leaves
    - Worker loses Rs. 500
    - How do you prevent this?

---

## ADMIN & OPERATIONAL QUESTIONS

### Verification Bottleneck

31. **What if admin verification is too slow?**
    - 100 workers apply → Admin verifies 10 per day
    - Workers wait 10 days → Get frustrated → Leave
    - How do you scale verification?

32. **What if admin makes a wrong verification?**
    - Admin approves unqualified worker → Worker does bad job
    - Customer complains → Platform reputation damaged
    - How do you handle admin errors?

33. **What if there's only one admin?**
    - Admin goes on vacation → No one verifies workers
    - Disputes pile up → Customers and workers angry
    - How do you ensure continuity?

### Dispute Resolution

34. **What if disputes take too long to resolve?**
    - Customer files dispute → Admin investigates
    - Investigation takes 2 weeks → Customer frustrated
    - Worker's money is held → Worker frustrated
    - What's the SLA for dispute resolution?

35. **What if both customer and worker are lying?**
    - Customer says "Worker didn't show up"
    - Worker says "I showed up but customer wasn't home"
    - No proof either way → How do you decide?

36. **What if disputes become legal issues?**
    - Customer threatens to sue → Worker threatens to sue
    - Platform is in the middle → Legal liability?
    - Do you have terms of service that protect the platform?

---

## SCALING & GROWTH QUESTIONS

37. **What if the platform expands to other cities?**
    - Rs. 500 commission works in Peshawar
    - Rs. 500 commission is too high in Karachi
    - Rs. 500 commission is too low in Islamabad
    - How do you handle multi-city pricing?

38. **What if there are not enough workers in certain categories?**
    - 100 customer requests for plumbers → Only 5 plumbers available
    - Customers wait → Leave the platform
    - How do you ensure supply meets demand?

39. **What if competitors copy the business model?**
    - Another platform launches with Rs. 400 commission
    - Workers switch to the cheaper platform
    - How do you defend your market position?

40. **What if the platform becomes too popular too fast?**
    - 10,000 users → 100,000 users overnight
    - Servers crash → Customer complaints → Workers leave
    - How do you handle sudden growth?

---

## TECHNICAL RISKS

41. **What if Redis cache goes down?**
    - Worker ONLINE status is stored in Redis
    - Redis fails → All workers appear OFFLINE
    - Customers see no workers → Platform seems dead
    - What's the failover plan?

42. **What if the notification system fails?**
    - Worker gets job offer → Notification never arrives
    - Worker misses the job → Customer waits forever
    - How do you ensure notifications are delivered?

43. **What if the chat system has downtime?**
    - Customer and worker need to communicate
    - Chat is down → Miscommunication → Bad experience
    - What's the backup communication method?

44. **What if the database becomes slow?**
    - 10,000 concurrent users → Database queries slow down
    - Pages take 10 seconds to load → Users leave
    - How do you ensure performance at scale?

45. **What if there's a data breach?**
    - Customer phone numbers are leaked
    - Worker bank details are leaked
    - Legal liability → Reputation damage
    - What's the security incident response plan?

---

## COMPETITIVE & MARKET QUESTIONS

46. **Why would a customer use HUNAR instead of calling a friend?**
    - "I know a guy who knows a guy" is the current system
    - HUNAR needs to be significantly better
    - What's the unique value proposition?

47. **Why would a worker join HUNAR instead of using existing channels?**
    - Workers already have word-of-mouth customers
    - HUNAR takes Rs. 500 per job
    - Why would workers pay for something they get for free?

48. **What if the market is too small?**
    - Peshawar has limited demand for skilled workers
    - Platform needs thousands of jobs to be profitable
    - What if the market size doesn't support the business?

49. **What if customers prefer cash over digital payments?**
    - Platform wants digital payments → Customer says "I'll pay cash"
    - Worker agrees → Platform gets no commission
    - How do you enforce digital payments?

50. **What if the platform becomes known for low-quality workers?**
    - A few bad experiences → Word spreads
    - "HUNAR has terrible workers" → Reputation damaged
    - How do you maintain quality control?

---

## REGULATORY & LEGAL QUESTIONS

51. **Does the platform need any licenses or permits?**
    - Operating as a marketplace → May need business registration
    - Handling payments → May need financial licenses
    - What are the legal requirements in Pakistan?

52. **What if a worker causes injury to a customer or their property?**
    - Worker injures themselves at customer's home
    - Worker damages expensive equipment
    - Is the platform liable? Is there insurance?

53. **What about tax implications?**
    - Platform earns commission → Subject to income tax?
    - Workers earn through platform → Tax reporting?
    - Who is responsible for tax compliance?

54. **What about data privacy?**
    - Platform collects phone numbers, locations, payment info
    - Pakistan has data protection laws
    - How do you ensure compliance?

---

## SUMMARY OF CRITICAL RISKS

| RISK CATEGORY | SEVERITY | LIKELIHOOD |
|---|---|---|
| Commission model unsustainability | HIGH | MEDIUM |
| Platform circumvention (offline deals) | HIGH | HIGH |
| Worker exploitation (unfair Rs. 500 loss) | HIGH | HIGH |
| Customer fraud (fake jobs, refusal to pay) | MEDIUM | MEDIUM |
| Verification bottleneck | MEDIUM | HIGH |
| Dispute resolution delays | MEDIUM | MEDIUM |
| Technical failures (Redis, notifications) | HIGH | LOW |
| Competition from cheaper alternatives | HIGH | MEDIUM |
| Legal/regulatory issues | MEDIUM | LOW |

---

*This document identifies potential problems, mismanagement risks, and critical questions that need answers before and during platform operation. Each question represents a real-world scenario that could harm the platform's success, fairness, or sustainability.*
