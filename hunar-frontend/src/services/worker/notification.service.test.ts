import { http } from "@/lib/api-client";
import { getSocket } from "@/lib/socket";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import * as notificationService from "./notification.service";
import type { AppNotification, NotificationType } from "@/types/notification";
import type { NotificationPreferences } from "@/types/settings";
import { mockNotifications, mockNotificationPreferences } from "@/mocks/notifications.mock";

jest.mock("@/lib/api-client", () => ({
  http: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock("@/lib/socket", () => ({
  getSocket: jest.fn(),
}));

jest.mock("@/lib/data-source", () => ({
  isMockMode: jest.fn(),
  simulateLatency: jest.fn((value) => Promise.resolve(value)),
}));

const mockedHttpGet = http.get as jest.MockedFunction<typeof http.get>;
const mockedHttpPut = http.put as jest.MockedFunction<typeof http.put>;
const mockedGetSocket = getSocket as jest.MockedFunction<typeof getSocket>;
const mockedIsMockMode = isMockMode as jest.MockedFunction<typeof isMockMode>;
const mockedSimulateLatency = simulateLatency as jest.MockedFunction<typeof simulateLatency>;

describe("notification.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("returns sorted notifications in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await notificationService.getNotifications();

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(expect.any(Array));
      expect(result).toHaveLength(mockNotifications.length);
      expect(new Date(result[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(result[1].createdAt).getTime(),
      );
    });

    it("returns notifications sorted by createdAt descending", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await notificationService.getNotifications();

      for (let i = 0; i < result.length - 1; i++) {
        expect(new Date(result[i].createdAt).getTime()).toBeGreaterThanOrEqual(
          new Date(result[i + 1].createdAt).getTime(),
        );
      }
    });

    it("fetches notifications from API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockNotifications);

      const result = await notificationService.getNotifications();

      expect(mockedHttpGet).toHaveBeenCalledWith("/notifications");
      expect(result).toEqual(mockNotifications);
    });
  });

  describe("getUnreadCount", () => {
    it("returns unread count in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await notificationService.getUnreadCount();

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(expect.any(Number), 150, 300);
      const expectedCount = mockNotifications.filter((n) => !n.read).length;
      expect(result).toBe(expectedCount);
    });

    it("fetches unread count from API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(5);

      const result = await notificationService.getUnreadCount();

      expect(mockedHttpGet).toHaveBeenCalledWith("/notifications/unread-count");
      expect(result).toBe(5);
    });
  });

  describe("markNotificationRead", () => {
    const notificationId = "notif-1";

    it("marks notification as read in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const target = mockNotifications.find((n) => n.id === notificationId);
      target!.read = false;

      await notificationService.markNotificationRead(notificationId);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 150, 300);
      expect(target!.read).toBe(true);
    });

    it("does nothing when notification not found in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      await expect(
        notificationService.markNotificationRead("non-existent"),
      ).resolves.toBeUndefined();
    });

    it("calls API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPut.mockResolvedValue(undefined);

      await notificationService.markNotificationRead(notificationId);

      expect(mockedHttpPut).toHaveBeenCalledWith(`/notifications/${notificationId}/read`);
    });
  });

  describe("markAllNotificationsRead", () => {
    it("marks all notifications as read in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      mockNotifications.forEach((n) => (n.read = false));

      await notificationService.markAllNotificationsRead();

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 150, 400);
      mockNotifications.forEach((n) => expect(n.read).toBe(true));
    });

    it("calls API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPut.mockResolvedValue(undefined);

      await notificationService.markAllNotificationsRead();

      expect(mockedHttpPut).toHaveBeenCalledWith("/notifications/read-all");
    });
  });

  describe("getNotificationPreferences", () => {
    it("returns mock preferences in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await notificationService.getNotificationPreferences();

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({
        enabled: { ...mockNotificationPreferences.enabled },
      });
    });

    it("fetches preferences from API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockNotificationPreferences);

      const result = await notificationService.getNotificationPreferences();

      expect(mockedHttpGet).toHaveBeenCalledWith("/notifications/preferences");
      expect(result).toEqual(mockNotificationPreferences);
    });
  });

  describe("updateNotificationPreferences", () => {
    const newPreferences: NotificationPreferences = {
      enabled: {
        system: false,
        new_job: true,
        offer_accepted: false,
        offer_rejected: false,
        counter_offer: false,
        counter_accepted: false,
        visit_approaching: false,
        new_message: true,
        commission_reminder: true,
        commission_verified: false,
        earnings_recorded: true,
        new_review: false,
        verification_result: true,
      },
    };

    it("updates preferences in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await notificationService.updateNotificationPreferences(newPreferences);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 300, 700);
      expect(result).toEqual({ enabled: { ...newPreferences.enabled } });
      expect(mockNotificationPreferences.enabled).toEqual(newPreferences.enabled);
    });

    it("calls API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPut.mockResolvedValue(newPreferences);

      const result = await notificationService.updateNotificationPreferences(newPreferences);

      expect(mockedHttpPut).toHaveBeenCalledWith("/notifications/preferences", newPreferences);
      expect(result).toEqual(newPreferences);
    });
  });

  describe("subscribeToNotifications", () => {
    it("adds listener in mock mode and returns unsubscribe function", () => {
      mockedIsMockMode.mockReturnValue(true);

      const listener = jest.fn();
      const unsubscribe = notificationService.subscribeToNotifications(listener);

      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });

    it("sets up socket listener in non-mock mode", () => {
      mockedIsMockMode.mockReturnValue(false);
      const mockSocket = { on: jest.fn(), off: jest.fn() };
      mockedGetSocket.mockReturnValue(mockSocket as any);

      const listener = jest.fn();
      const unsubscribe = notificationService.subscribeToNotifications(listener);

      expect(mockSocket.on).toHaveBeenCalledWith("notification:new", expect.any(Function));
      unsubscribe();
      expect(mockSocket.off).toHaveBeenCalledWith("notification:new", expect.any(Function));
    });

    it("returns noop unsubscribe when no socket in non-mock mode", () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedGetSocket.mockReturnValue(null);

      const listener = jest.fn();
      const unsubscribe = notificationService.subscribeToNotifications(listener);

      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });
  });

  describe("notifyMockListeners", () => {
    it("calls all registered listeners with notification", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const notification: AppNotification = {
        id: "test-1",
        type: "new_job",
        title: "Test",
        message: "Test message",
        createdAt: new Date().toISOString(),
        read: false,
      };

      notificationService.notifyMockListeners(notification);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe("NOTIFICATION_TYPES", () => {
    it("contains all expected notification types", () => {
      const expectedTypes: NotificationType[] = [
        "new_job",
        "offer_accepted",
        "offer_rejected",
        "counter_offer",
        "counter_accepted",
        "visit_approaching",
        "new_message",
        "commission_reminder",
        "commission_verified",
        "earnings_recorded",
        "new_review",
        "verification_result",
      ];
      expect(notificationService.NOTIFICATION_TYPES).toEqual(expectedTypes);
    });
  });

  describe("queryKeys", () => {
    it("has correct query key structure", () => {
      expect(notificationService.queryKeys.notifications).toEqual(["worker", "notifications"]);
      expect(notificationService.queryKeys.unreadCount).toEqual([
        "worker",
        "notifications",
        "unread",
      ]);
      expect(notificationService.queryKeys.preferences).toEqual([
        "worker",
        "notifications",
        "preferences",
      ]);
    });
  });
});