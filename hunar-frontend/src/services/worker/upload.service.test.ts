import { isMockMode, simulateLatency } from "@/lib/data-source";
import * as uploadService from "./upload.service";

const API_BASE_URL = "http://localhost:3000/api/v1";

jest.mock("@/lib/data-source", () => ({
  isMockMode: jest.fn(),
  simulateLatency: jest.fn((value) => Promise.resolve(value)),
}));

jest.mock("@/lib/api-client", () => {
  class MockApiError extends Error {
    status: number;
    payload?: unknown;

    constructor(message: string, status: number, payload?: unknown) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.payload = payload;
    }
  }

  return {
    ApiError: MockApiError,
    API_BASE_URL,
    getAccessToken: jest.fn(),
  };
});

const mockedIsMockMode = isMockMode as jest.MockedFunction<typeof isMockMode>;
const mockedSimulateLatency = simulateLatency as jest.MockedFunction<typeof simulateLatency>;
const mockedApiClient = jest.requireMock("@/lib/api-client");
const mockedGetAccessToken = mockedApiClient.getAccessToken as jest.MockedFunction<any>;
const MockApiError = mockedApiClient.ApiError;
const originalFetch = global.fetch;

describe("upload.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("validateImage", () => {
    it("returns null for valid JPEG file", () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const result = uploadService.validateImage(file);
      expect(result).toBeNull();
    });

    it("returns null for valid PNG file", () => {
      const file = new File(["test"], "test.png", { type: "image/png" });
      expect(uploadService.validateImage(file)).toBeNull();
    });

    it("returns null for valid WebP file", () => {
      const file = new File(["test"], "test.webp", { type: "image/webp" });
      expect(uploadService.validateImage(file)).toBeNull();
    });

    it("returns null for valid GIF file", () => {
      const file = new File(["test"], "test.gif", { type: "image/gif" });
      expect(uploadService.validateImage(file)).toBeNull();
    });

    it("returns UNSUPPORTED_FILE_TYPE for invalid MIME type", () => {
      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      expect(uploadService.validateImage(file)).toBe("UNSUPPORTED_FILE_TYPE");
    });

    it("returns FILE_TOO_LARGE for file exceeding max size", () => {
      const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      });
      expect(uploadService.validateImage(largeFile)).toBe("FILE_TOO_LARGE");
    });

    it("returns null for file at exact max size", () => {
      const exactFile = new File(["x".repeat(5 * 1024 * 1024)], "exact.jpg", {
        type: "image/jpeg",
      });
      expect(uploadService.validateImage(exactFile)).toBeNull();
    });

    it("returns FILE_TOO_LARGE for file slightly over max size", () => {
      const overFile = new File(["x".repeat(5 * 1024 * 1024 + 1)], "over.jpg", {
        type: "image/jpeg",
      });
      expect(uploadService.validateImage(overFile)).toBe("FILE_TOO_LARGE");
    });
  });

  describe("uploadImage", () => {
    const mockFile = new File(["test image"], "test.jpg", { type: "image/jpeg" });
    const originalCreateObjectURL = global.URL?.createObjectURL;

    beforeEach(() => {
      global.URL = global.URL || {};
      global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    });

    afterAll(() => {
      if (originalCreateObjectURL) {
        global.URL.createObjectURL = originalCreateObjectURL;
      }
    });

    it("returns object URL in mock mode", async () => {
      mockedIsMockMode.mockReturnValue(true);
      mockedSimulateLatency.mockImplementation((value) => Promise.resolve(value));

      const result = await uploadService.uploadImage(mockFile);

      expect(mockedIsMockMode).toHaveBeenCalled();
      expect(mockedSimulateLatency).toHaveBeenCalledWith(undefined, 700, 1500);
      expect(result.url).toBe("blob:mock-url");
    });

    it("uploads file via fetch in non-mock mode with token", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedGetAccessToken.mockReturnValue("test-token");
      const mockResponse = { url: "https://cdn.example.com/image.jpg" };
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
      global.fetch = fetchMock;

      const result = await uploadService.uploadImage(mockFile);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${API_BASE_URL}/uploads`);
      expect(options?.method).toBe("POST");
      expect(options?.headers).toBeDefined();
      // The headers should be a Headers object with Authorization
      if (options?.headers instanceof Headers) {
        expect(options.headers.get("Authorization")).toBe("Bearer test-token");
      }
      expect(options?.body).toBeInstanceOf(FormData);
      expect(result).toEqual(mockResponse);
    });

    it("uploads file without token when not available", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedGetAccessToken.mockReturnValue(null);
      const mockResponse = { url: "https://cdn.example.com/image.jpg" };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await uploadService.uploadImage(mockFile);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/uploads`,
        expect.objectContaining({
          method: "POST",
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
          body: expect.any(FormData),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("throws ApiError when upload fails", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedGetAccessToken.mockReturnValue("test-token");
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(uploadService.uploadImage(mockFile)).rejects.toThrow(MockApiError);
      await expect(uploadService.uploadImage(mockFile)).rejects.toThrow("Upload failed.");
    });

    it("throws ApiError with status 0 for network errors", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedGetAccessToken.mockReturnValue("test-token");
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      await expect(uploadService.uploadImage(mockFile)).rejects.toThrow(MockApiError);
      await expect(uploadService.uploadImage(mockFile)).rejects.toMatchObject({
        status: 0,
      });
    });

    it("re-throws ApiError directly", async () => {
      mockedIsMockMode.mockReturnValue(false);
      mockedGetAccessToken.mockReturnValue("test-token");
      const apiError = new MockApiError("Custom error", 400);
      global.fetch = jest.fn().mockRejectedValue(apiError);

      await expect(uploadService.uploadImage(mockFile)).rejects.toThrow(apiError);
    });
  });

  describe("constants", () => {
    it("has correct IMAGE_MIME_TYPES", () => {
      expect(uploadService.IMAGE_MIME_TYPES).toEqual([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ]);
    });

    it("has correct MAX_IMAGE_SIZE_BYTES (5MB)", () => {
      expect(uploadService.MAX_IMAGE_SIZE_BYTES).toBe(5 * 1024 * 1024);
    });
  });
});