import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  token: string;
}

export interface MulticastPushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  tokens: string[];
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private messaging: any = null;
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const firebaseConfig = this.configService.get('firebase');
      if (!firebaseConfig?.projectId) {
        this.logger.warn('Firebase configuration not found. Push notifications disabled.');
        return;
      }

      const { getMessaging } = await import('firebase-admin/messaging');

      if (getApps().length === 0) {
        initializeApp({
          credential: cert({
            projectId: firebaseConfig.projectId,
            clientEmail: firebaseConfig.clientEmail,
            privateKey: firebaseConfig.privateKey?.replace(/\\n/g, '\n'),
          }),
        });
      }

      this.messaging = getMessaging();
      this.initialized = true;
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
      this.initialized = false;
    }
  }

  async sendPushNotification(payload: PushNotificationPayload): Promise<string | null> {
    if (!this.initialized || !this.messaging) {
      this.logger.warn('Firebase not initialized. Skipping push notification.');
      return null;
    }

    try {
      const message = {
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
        android: {
          priority: 'high' as const,
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      this.logger.debug(`Push notification sent: ${response}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to send push notification', error);
      return null;
    }
  }

  async sendMulticastPushNotification(
    payload: MulticastPushNotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.initialized || !this.messaging) {
      this.logger.warn('Firebase not initialized. Skipping multicast push notification.');
      return { successCount: 0, failureCount: payload.tokens.length };
    }

    if (!payload.tokens.length) {
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const message = {
        tokens: payload.tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
        android: {
          priority: 'high' as const,
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      const response = await this.messaging.sendEachForMulticast(message);
      this.logger.debug(
        `Multicast push sent: ${response.successCount} success, ${response.failureCount} failed`,
      );
      return { successCount: response.successCount, failureCount: response.failureCount };
    } catch (error) {
      this.logger.error('Failed to send multicast push notification', error);
      return { successCount: 0, failureCount: payload.tokens.length };
    }
  }

  async sendToTopic(
    topic: string,
    payload: Omit<PushNotificationPayload, 'token'>,
  ): Promise<string | null> {
    if (!this.initialized || !this.messaging) {
      this.logger.warn('Firebase not initialized. Skipping topic push notification.');
      return null;
    }

    try {
      const message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
        android: {
          priority: 'high' as const,
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      this.logger.debug(`Topic push notification sent to ${topic}: ${response}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to send topic push notification', error);
      return null;
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.initialized || !this.messaging) {
      this.logger.warn('Firebase not initialized. Skipping topic subscription.');
      return;
    }

    try {
      await this.messaging.subscribeToTopic(tokens, topic);
      this.logger.debug(`Subscribed ${tokens.length} tokens to topic: ${topic}`);
    } catch (error) {
      this.logger.error('Failed to subscribe to topic', error);
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.initialized || !this.messaging) {
      this.logger.warn('Firebase not initialized. Skipping topic unsubscription.');
      return;
    }

    try {
      await this.messaging.unsubscribeFromTopic(tokens, topic);
      this.logger.debug(`Unsubscribed ${tokens.length} tokens from topic: ${topic}`);
    } catch (error) {
      this.logger.error('Failed to unsubscribe from topic', error);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
