export interface FcmConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export default () => {
  const fcmConfig: FcmConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY ?? '',
  };
  return fcmConfig;
};
