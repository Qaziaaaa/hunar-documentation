export interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
}

export default () => {
  const brevoConfig: BrevoConfig = {
    apiKey: process.env.BREVO_API_KEY ?? '',
    senderEmail: process.env.BREVO_SENDER_EMAIL ?? '',
    senderName: process.env.BREVO_SENDER_NAME ?? 'WorkerFix',
  };
  return { brevo: brevoConfig };
};
