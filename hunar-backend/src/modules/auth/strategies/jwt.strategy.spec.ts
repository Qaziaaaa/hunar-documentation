import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../../prisma/prisma.service';

describe('JwtStrategy (AUDIT-020)', () => {
  let strategy: JwtStrategy;
  let prismaMock: any;
  let configMock: ConfigService;

  beforeEach(() => {
    configMock = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.secret' || key === 'secret') return 'test-secret';
        return null;
      }),
    } as unknown as ConfigService;

    prismaMock = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    strategy = new JwtStrategy(configMock, prismaMock as unknown as PrismaService);
  });

  it('rejects a token with purpose: refresh', async () => {
    await expect(
      strategy.validate({ sub: 'user-1', phone: '+923001111111', role: Role.CUSTOMER, purpose: 'refresh' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid token'));
  });

  it('rejects a token without sub', async () => {
    await expect(
      strategy.validate({ sub: '', phone: '+923001111111', role: Role.CUSTOMER }),
    ).rejects.toThrow(new UnauthorizedException('Invalid token payload'));
  });

  it('rejects a token when user is not found in database', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'deleted-user', phone: '+923001111111', role: Role.CUSTOMER }),
    ).rejects.toThrow(new UnauthorizedException('User account no longer exists'));

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'deleted-user' },
      select: {
        id: true,
        phone: true,
        role: true,
        isActive: true,
        suspendedUntil: true,
        suspensionReason: true,
      },
    });
  });

  it('rejects a token when user is permanently suspended', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'banned-user',
      phone: '+923001111111',
      role: Role.WORKER,
      isActive: false,
      suspendedUntil: null,
      suspensionReason: 'Fraudulent activity detected',
    });

    await expect(
      strategy.validate({ sub: 'banned-user', phone: '+923001111111', role: Role.WORKER }),
    ).rejects.toThrow('Account has been suspended. Reason: Fraudulent activity detected');
  });

  it('rejects a token when user has an active temporary suspension', async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'temp-suspended-user',
      phone: '+923001111111',
      role: Role.CUSTOMER,
      isActive: false,
      suspendedUntil: futureDate,
      suspensionReason: 'Multiple policy violations',
    });

    await expect(
      strategy.validate({ sub: 'temp-suspended-user', phone: '+923001111111', role: Role.CUSTOMER }),
    ).rejects.toThrow(/Account is temporarily suspended until/);
  });

  it('auto-reactivates user when temporary suspension has expired', async () => {
    const pastDate = new Date(Date.now() - 60 * 1000);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'expired-suspension-user',
      phone: '+923001111111',
      role: Role.WORKER,
      isActive: false,
      suspendedUntil: pastDate,
      suspensionReason: '24hr cooling off',
    });

    prismaMock.user.update.mockResolvedValue({
      id: 'expired-suspension-user',
      isActive: true,
    });

    const result = await strategy.validate({
      sub: 'expired-suspension-user',
      phone: '+923001111111',
      role: Role.WORKER,
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'expired-suspension-user' },
      data: {
        isActive: true,
        suspendedUntil: null,
        suspensionReason: null,
        suspensionType: null,
      },
    });
    expect(result).toEqual({
      sub: 'expired-suspension-user',
      phone: '+923001111111',
      role: Role.WORKER,
    });
  });

  it('allows active users with valid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'valid-user',
      phone: '+923001111111',
      role: Role.CUSTOMER,
      isActive: true,
      suspendedUntil: null,
      suspensionReason: null,
    });

    const result = await strategy.validate({
      sub: 'valid-user',
      phone: '+923001111111',
      role: Role.CUSTOMER,
    });

    expect(result).toEqual({
      sub: 'valid-user',
      phone: '+923001111111',
      role: Role.CUSTOMER,
    });
  });
});

