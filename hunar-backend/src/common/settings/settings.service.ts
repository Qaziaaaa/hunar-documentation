import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

// Defaults for every runtime-controlled business value. The PlatformSetting
// table (seeded by prisma/seed.ts, edited via PUT /admin/settings) overrides
// these — services must read through SettingsService, never hardcode numbers.
export const SETTINGS_DEFAULTS = {
  commissionRate: 0.1,
  serviceRadiusKm: 10,
  walletMaxNegativeBalance: -500,
  maxActiveOffersPerWorker: 1,
} as const;

/**
 * Shared read-through cache for PlatformSetting (key-value table).
 * 60s TTL keeps hot money/geo paths at one read/minute; updateSettings()
 * calls invalidate() so admin edits apply immediately.
 */
@Injectable()
export class SettingsService {
  private static readonly TTL_MS = 60_000;

  private cache: Record<string, string> | null = null;
  private expiresAt = 0;
  private inflight: Promise<Record<string, string>> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private async loadAll(): Promise<Record<string, string>> {
    if (this.cache && Date.now() < this.expiresAt) return this.cache;
    if (this.inflight) return this.inflight;
    this.inflight = this.prisma.platformSetting
      .findMany({ select: { key: true, value: true } })
      .then((rows) => {
        const map: Record<string, string> = {};
        for (const row of rows) map[row.key] = row.value;
        this.cache = map;
        this.expiresAt = Date.now() + SettingsService.TTL_MS;
        return map;
      })
      .finally(() => {
        this.inflight = null;
      });
    return this.inflight;
  }

  async invalidate(): Promise<void> {
    this.cache = null;
    this.expiresAt = 0;
  }

  /** Commission as a fraction (0.1 = 10%). Legacy snake_case key accepted. */
  async getCommissionRate(): Promise<number> {
    const all = await this.loadAll();
    const raw = all.commissionRate ?? all.commission_rate;
    const parsed = Number(raw);
    if (raw !== undefined && Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
    return Number(this.config.get<string>('app.commissionRate', '0.10')) || SETTINGS_DEFAULTS.commissionRate;
  }

  /** Default worker search radius in km (worker profile value wins if set). */
  async getServiceRadiusKm(): Promise<number> {
    const all = await this.loadAll();
    const parsed = Number(all.serviceRadiusKm);
    if (all.serviceRadiusKm !== undefined && Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return SETTINGS_DEFAULTS.serviceRadiusKm;
  }

  /** Workers may not fall below this balance; below/at it they go offline. */
  async getWalletMaxNegativeBalance(): Promise<number> {
    const all = await this.loadAll();
    const parsed = Number(all.walletMaxNegativeBalance);
    if (all.walletMaxNegativeBalance !== undefined && Number.isFinite(parsed)) {
      return Math.round(parsed);
    }
    return SETTINGS_DEFAULTS.walletMaxNegativeBalance;
  }

  /** Cap on simultaneously active (unanswered) offers per worker. */
  async getMaxActiveOffersPerWorker(): Promise<number> {
    const all = await this.loadAll();
    const parsed = Number(all.maxActiveOffersPerWorker);
    if (all.maxActiveOffersPerWorker !== undefined && Number.isFinite(parsed) && parsed >= 1) {
      return Math.floor(parsed);
    }
    return SETTINGS_DEFAULTS.maxActiveOffersPerWorker;
  }
}
