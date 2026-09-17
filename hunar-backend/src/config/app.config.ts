export interface AppConfig {
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  commissionRate: string;
  commissionWhatsAppNumber: string;
  commissionBankAccount: string;
  maxNegotiationRounds: number;
}

export default () => {
  const appConfig: AppConfig = {
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api/v1',
    corsOrigins: (process.env.CORS_ORIGINS ?? '*').split(',').map((s) => s.trim()),
    commissionRate: process.env.COMMISSION_RATE ?? '0.10',
    commissionWhatsAppNumber: process.env.COMMISSION_WHATSAPP_NUMBER ?? '+92 314 0837519',
    commissionBankAccount: process.env.COMMISSION_BANK_ACCOUNT ?? 'HUNAR Platform Bank Account',
    maxNegotiationRounds: parseInt(process.env.MAX_NEGOTIATION_ROUNDS ?? '5', 10),
  };
  return appConfig;
};
