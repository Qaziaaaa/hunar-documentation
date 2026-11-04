import {
  getUrgentOfferTimer,
  getOfferRemainingSeconds,
  isUrgentOfferActive,
  clearOfferExpiryCache,
  URGENT_OFFER_TTL_SECONDS,
} from "./urgent-offer";

describe("urgent-offer utility", () => {
  const originalDateNow = Date.now;

  afterEach(() => {
    Date.now = originalDateNow;
    clearOfferExpiryCache();
  });

  it("calculates remaining seconds and progress correctly when in sync", () => {
    const fixedNow = 1_000_000;
    Date.now = () => fixedNow;

    const createdAt = new Date(fixedNow - 10_000).toISOString(); // 10 seconds ago
    const expiresAt = new Date(fixedNow + 40_000).toISOString(); // 40 seconds left

    const timer = getUrgentOfferTimer({ createdAt, expiresAt });
    expect(timer.remainingSeconds).toBe(40);
    expect(timer.progress).toBeCloseTo(40 / 50, 2);
    expect(timer.isExpired).toBe(false);
  });

  it("progressively decreases remainingMs and remainingSeconds over time as clock advances", () => {
    let mockNow = 1_000_000;
    Date.now = () => mockNow;

    const offer = {
      id: "offer-progress-test",
      createdAt: new Date(mockNow).toISOString(),
      expiresAt: new Date(mockNow + 50_000).toISOString(),
      serverTime: new Date(mockNow).toISOString(),
    };

    // Initial state: 50s left
    const t0 = getUrgentOfferTimer(offer);
    expect(t0.remainingSeconds).toBe(50);
    expect(t0.progress).toBeCloseTo(1.0, 2);

    // 10 seconds elapse
    mockNow += 10_000;
    const t1 = getUrgentOfferTimer(offer);
    expect(t1.remainingSeconds).toBe(40);
    expect(t1.progress).toBeCloseTo(40 / 50, 2);

    // 47 seconds elapse (3 seconds remaining)
    mockNow += 37_000;
    const t2 = getUrgentOfferTimer(offer);
    expect(t2.remainingSeconds).toBe(3);
    expect(t2.isExpired).toBe(false);

    // 50 seconds elapse: expired
    mockNow += 3_000;
    const t3 = getUrgentOfferTimer(offer);
    expect(t3.remainingSeconds).toBe(0);
    expect(t3.progress).toBe(0);
    expect(t3.isExpired).toBe(true);
  });

  it("compensates for client clock skew when client clock is ahead of server", () => {
    const serverTimeMs = 1_000_000;
    const expiresAt = new Date(serverTimeMs + 50_000).toISOString();
    const serverTime = new Date(serverTimeMs).toISOString();

    let clientNow = serverTimeMs + 5_000; // Client is 5s ahead
    Date.now = () => clientNow;

    const offer = {
      id: "offer-skew-ahead",
      createdAt: serverTime,
      expiresAt,
      serverTime,
    };

    const timer = getUrgentOfferTimer(offer);
    expect(timer.remainingSeconds).toBe(50);
    expect(timer.isExpired).toBe(false);

    // After 5 seconds client-time elapsed
    clientNow += 5_000;
    const timerLater = getUrgentOfferTimer(offer);
    expect(timerLater.remainingSeconds).toBe(45);
  });

  it("compensates for client clock skew when client clock is behind server", () => {
    const serverTimeMs = 1_000_000;
    const expiresAt = new Date(serverTimeMs + 50_000).toISOString();
    const serverTime = new Date(serverTimeMs).toISOString();

    let clientNow = serverTimeMs - 5_000; // Client is 5s behind
    Date.now = () => clientNow;

    const offer = {
      id: "offer-skew-behind",
      createdAt: serverTime,
      expiresAt,
      serverTime,
    };

    const timer = getUrgentOfferTimer(offer);
    expect(timer.remainingSeconds).toBe(50);
    expect(timer.isExpired).toBe(false);

    clientNow += 5_000;
    const timerLater = getUrgentOfferTimer(offer);
    expect(timerLater.remainingSeconds).toBe(45);
  });

  it("marks offer as expired when remaining time is 0 or negative", () => {
    const fixedNow = 1_000_000;
    Date.now = () => fixedNow;

    const createdAt = new Date(fixedNow - 55_000).toISOString(); // 55 seconds ago

    const timer = getUrgentOfferTimer({ createdAt });
    expect(timer.remainingSeconds).toBe(0);
    expect(timer.progress).toBe(0);
    expect(timer.isExpired).toBe(true);
    expect(isUrgentOfferActive({ createdAt })).toBe(false);
  });

  it("safely handles null/undefined inputs", () => {
    const timer = getUrgentOfferTimer(null);
    expect(timer.remainingSeconds).toBe(0);
    expect(timer.isExpired).toBe(true);
    expect(isUrgentOfferActive(null)).toBe(false);
    expect(getOfferRemainingSeconds(undefined)).toBe(0);
  });
});
