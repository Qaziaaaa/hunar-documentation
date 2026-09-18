-- HUNAR Task 2 — Worker Profile / 6-Step Onboarding (WorkerProfile, ServiceArea, VerificationDocument).
-- PostGIS note: ServiceArea.location is a geometry(Point, 4326); a GiST index improves proximity matching.

-- CreateEnum
CREATE TYPE "WorkerVerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'REQUEST_CHANGES');

-- CreateEnum
CREATE TYPE "VerificationDocumentType" AS ENUM ('CNIC_FRONT', 'CNIC_BACK', 'CERTIFICATE');

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "userId" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceYears" INTEGER,
    "bio" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "serviceRadiusKm" INTEGER NOT NULL DEFAULT 10,
    "verificationStatus" "WorkerVerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "rejectionReason" TEXT,
    "adminNote" TEXT,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geometry(Point, 4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "VerificationDocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkerProfile_skills_idx" ON "WorkerProfile" USING GIN ("skills");

-- CreateIndex
CREATE INDEX "WorkerProfile_verificationStatus_idx" ON "WorkerProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "WorkerProfile_isAvailable_idx" ON "WorkerProfile"("isAvailable");

-- CreateIndex
CREATE INDEX "ServiceArea_userId_idx" ON "ServiceArea"("userId");

-- CreateIndex
CREATE INDEX "ServiceArea_location_gist_idx" ON "ServiceArea" USING GIST ("location");

-- CreateIndex
CREATE INDEX "VerificationDocument_userId_idx" ON "VerificationDocument"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationDocument_userId_type_key" ON "VerificationDocument"("userId", "type");

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceArea" ADD CONSTRAINT "ServiceArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;