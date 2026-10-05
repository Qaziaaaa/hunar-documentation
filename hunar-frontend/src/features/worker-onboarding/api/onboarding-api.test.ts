import { http } from "@/lib/api-client";
import { uploadWorkerDocument } from "./onboarding-api";

jest.mock("@/lib/api-client", () => ({
    http: { upload: jest.fn() },
}));

const uploadMock = http.upload as jest.Mock;

describe("uploadWorkerDocument", () => {
    const file = new File(["profile image"], "profile.jpg", { type: "image/jpeg" });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns the hosted profile photo URL", async () => {
        uploadMock.mockResolvedValue({ url: "https://res.cloudinary.com/demo/image/upload/profile.jpg" });

        await expect(uploadWorkerDocument(file, "avatar")).resolves.toEqual({
            url: "https://res.cloudinary.com/demo/image/upload/profile.jpg",
            filename: "profile.jpg",
        });
        expect(uploadMock).toHaveBeenCalledWith("/uploads/profile-photo", expect.any(FormData));
    });

    it("surfaces upload failures instead of falling back to a data URL", async () => {
        uploadMock.mockRejectedValue(new Error("Cloudinary upload failed"));

        await expect(uploadWorkerDocument(file, "avatar")).rejects.toThrow(
            "Cloudinary upload failed",
        );
    });

    it("rejects a hosted URL longer than the backend limit", async () => {
        uploadMock.mockResolvedValue({ url: `https://cloudinary.example/${"x".repeat(500)}` });

        await expect(uploadWorkerDocument(file, "avatar")).rejects.toThrow(
            "Upload response did not contain a valid profile photo URL.",
        );
    });
});