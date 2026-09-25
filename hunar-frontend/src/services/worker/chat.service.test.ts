import { http } from "@/lib/api-client";
import { connectSocket, getSocket } from "@/lib/socket";
import { CHAT_EVENT } from "@/lib/socket-events";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import * as chatService from "./chat.service";
import type { ChatMessage, Conversation, SendMessageInput } from "@/types/chat";
import { mockConversations, mockMessages } from "@/mocks/chat.mock";

jest.mock("@/lib/api-client", () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock("@/lib/socket", () => ({
  connectSocket: jest.fn(),
  getSocket: jest.fn(),
}));

jest.mock("@/lib/socket-events", () => ({
  CHAT_EVENT: {
    receive: "chat:receive",
    send: "chat:send",
    join: "chat:join",
    leave: "chat:leave",
  },
}));

jest.mock("@/lib/data-source", () => ({
  isMockMode: jest.fn(),
  simulateLatency: jest.fn((value) => Promise.resolve(value)),
}));

// Store original mock data for reset
const originalMockConversations = JSON.parse(JSON.stringify(mockConversations));
const originalMockMessages = JSON.parse(JSON.stringify(mockMessages));

const mockedHttpGet = http.get as jest.MockedFunction<typeof http.get>;
const mockedHttpPost = http.post as jest.MockedFunction<typeof http.post>;
const mockedHttpPut = http.put as jest.MockedFunction<typeof http.put>;
const mockedConnectSocket = connectSocket as jest.MockedFunction<typeof connectSocket>;
const mockedGetSocket = getSocket as jest.MockedFunction<typeof getSocket>;
const mockedIsMockMode = isMockMode as jest.MockedFunction<typeof isMockMode>;
const mockedSimulateLatency = simulateLatency as jest.MockedFunction<typeof simulateLatency>;

describe("chat.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock data
    mockConversations.length = 0;
    mockConversations.push(...JSON.parse(JSON.stringify(originalMockConversations)));
    Object.keys(mockMessages).forEach((key) => delete mockMessages[key]);
    Object.assign(mockMessages, JSON.parse(JSON.stringify(originalMockMessages)));
  });

  describe("getConversations", () => {
    it("returns mock conversations in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await chatService.getConversations();

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(expect.any(Array));
      expect(result).toEqual(mockConversations);
    });

    it("fetches conversations from API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockConversations);

      const result = await chatService.getConversations();

      expect(mockedHttpGet).toHaveBeenCalledWith("/conversations/my");
      expect(result).toEqual(mockConversations);
    });
  });

  describe("getMessages", () => {
    const conversationId = "conv-elc-101";

    it("returns mock messages for conversation in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await chatService.getMessages(conversationId);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(expect.any(Array));
      expect(result).toEqual(mockMessages[conversationId]);
    });

    it("returns empty array for unknown conversation in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await chatService.getMessages("unknown-conv");

      expect(result).toEqual([]);
    });

    it("fetches messages from API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpGet.mockResolvedValue(mockMessages[conversationId]);

      const result = await chatService.getMessages(conversationId);

      expect(mockedHttpGet).toHaveBeenCalledWith(`/conversations/${conversationId}/messages`);
      expect(result).toEqual(mockMessages[conversationId]);
    });
  });

  describe("sendMessage", () => {
    const sendInput: SendMessageInput = {
      conversationId: "conv-elc-101",
      text: "Test message",
    };

    it("sends message and returns created message in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await chatService.sendMessage(sendInput);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 200, 500);
      expect(result.conversationId).toBe(sendInput.conversationId);
      expect(result.senderId).toBe("worker-demo-1");
      expect(result.senderRole).toBe("worker");
      expect(result.text).toBe("Test message");
      expect(result.status).toBe("sent");
      expect(result.createdAt).toBeDefined();
    });

    it("adds message to mock messages store", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const initialLength = mockMessages[sendInput.conversationId].length;
      await chatService.sendMessage(sendInput);

      expect(mockMessages[sendInput.conversationId]).toHaveLength(initialLength + 1);
    });

    it("sends message with imageUrl", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const inputWithImage = { ...sendInput, imageUrl: "https://example.com/image.jpg" };
      const result = await chatService.sendMessage(inputWithImage);

      expect(result.imageUrl).toBe("https://example.com/image.jpg");
    });

    it("updates conversation lastMessage and notifies listeners", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const conversation = mockConversations.find((c) => c.id === sendInput.conversationId);
      const originalLastMessage = conversation?.lastMessage;

      await chatService.sendMessage(sendInput);

      expect(conversation?.lastMessage).toBe("Test message");
      expect(conversation?.lastMessageAt).toBeDefined();
      expect(conversation?.lastMessage).not.toBe(originalLastMessage);
    });

    it("sends message via API in non-mock mode", async () => {
      const apiResponse: ChatMessage = {
        id: "msg-api-1",
        conversationId: sendInput.conversationId,
        senderId: "worker-demo-1",
        senderRole: "worker",
        text: "Test message",
        status: "sent",
        createdAt: new Date().toISOString(),
      };
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPost.mockResolvedValue(apiResponse);
      mockedConnectSocket.mockReturnValue({
        emit: jest.fn(),
      } as any);

      const result = await chatService.sendMessage(sendInput);

      expect(mockedHttpPost).toHaveBeenCalledWith(
        `/conversations/${sendInput.conversationId}/messages`,
        { text: "Test message", imageUrl: undefined },
      );
      expect(mockedConnectSocket).toHaveBeenCalled();
      expect(result).toEqual(apiResponse);
    });
  });

  describe("markConversationRead", () => {
    const conversationId = "conv-elc-101";

    it("marks conversation as read in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const conversation = mockConversations.find((c) => c.id === conversationId);
      conversation!.unreadCount = 5;

      await chatService.markConversationRead(conversationId);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 150, 400);
      expect(conversation?.unreadCount).toBe(0);
    });

    it("calls API in non-mock mode", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedHttpPut.mockResolvedValue(undefined);

      await chatService.markConversationRead(conversationId);

      expect(mockedHttpPut).toHaveBeenCalledWith(`/conversations/${conversationId}/read`);
    });
  });

  describe("subscribeToMessages", () => {
    it("adds listener in mock mode and returns unsubscribe function", () => {
      mockedIsMockMode.mockReturnValue(true);

      const listener = jest.fn();
      const unsubscribe = chatService.subscribeToMessages(listener);

      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });

    it("sets up socket listener in non-mock mode", () => {
      mockedIsMockMode.mockReturnValue(false);
      const mockSocket = { on: jest.fn(), off: jest.fn() };
      mockedGetSocket.mockReturnValue(mockSocket as any);

      const listener = jest.fn();
      const unsubscribe = chatService.subscribeToMessages(listener);

      expect(mockSocket.on).toHaveBeenCalledWith("chat:receive", expect.any(Function));
      unsubscribe();
      expect(mockSocket.off).toHaveBeenCalledWith("chat:receive", expect.any(Function));
    });

    it("returns noop unsubscribe when no socket in non-mock mode", () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedGetSocket.mockReturnValue(null);

      const listener = jest.fn();
      const unsubscribe = chatService.subscribeToMessages(listener);

      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });
  });

  describe("subscribeToConversations", () => {
    it("adds listener in mock mode and returns unsubscribe function", () => {
      mockedIsMockMode.mockReturnValue(true);

      const listener = jest.fn();
      const unsubscribe = chatService.subscribeToConversations(listener);

      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });

    it("sets up socket listener in non-mock mode", () => {
      mockedIsMockMode.mockReturnValue(false);
      const mockSocket = { on: jest.fn(), off: jest.fn() };
      mockedGetSocket.mockReturnValue(mockSocket as any);

      const listener = jest.fn();
      const unsubscribe = chatService.subscribeToConversations(listener);

      expect(mockSocket.on).toHaveBeenCalledWith("conversation:updated", expect.any(Function));
      unsubscribe();
      expect(mockSocket.off).toHaveBeenCalledWith("conversation:updated", expect.any(Function));
    });
  });

  describe("joinConversationRoom", () => {
    it("emits join event when socket exists", () => {
      const mockSocket = { emit: jest.fn() };
      mockedGetSocket.mockReturnValue(mockSocket as any);

      chatService.joinConversationRoom("conv-123");

      expect(mockSocket.emit).toHaveBeenCalledWith("chat:join", { conversationId: "conv-123" });
    });

    it("does nothing when no socket", () => {
      mockedGetSocket.mockReturnValue(null);

      expect(() => chatService.joinConversationRoom("conv-123")).not.toThrow();
    });
  });

  describe("leaveConversationRoom", () => {
    it("emits leave event when socket exists", () => {
      const mockSocket = { emit: jest.fn() };
      mockedGetSocket.mockReturnValue(mockSocket as any);

      chatService.leaveConversationRoom("conv-123");

      expect(mockSocket.emit).toHaveBeenCalledWith("chat:leave", { conversationId: "conv-123" });
    });
  });

  describe("convertFileToAttachment", () => {
    it("converts File to ChatAttachment", () => {
      const file = new File(["test content"], "test.txt", { type: "text/plain" });
      const attachment = chatService.convertFileToAttachment(file);

      expect(attachment.name).toBe("test.txt");
      expect(attachment.size).toBe(file.size);
      expect(attachment.type).toBe("text/plain");
      expect(attachment.url).toBe("");
      expect(attachment.id).toMatch(/^file-\d+$/);
    });
  });

  describe("queryKeys", () => {
    it("has correct query key structure", () => {
      expect(chatService.queryKeys.conversations).toEqual(["worker", "chat", "conversations"]);
      expect(chatService.queryKeys.messages("conv-123")).toEqual([
        "worker",
        "chat",
        "messages",
        "conv-123",
      ]);
    });
  });
});