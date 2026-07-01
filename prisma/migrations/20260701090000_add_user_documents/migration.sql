-- CreateTable
CREATE TABLE "UserDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "issuer" TEXT,
    "issuedDate" TIMESTAMP(3),
    "fileUrl" TEXT NOT NULL,
    "filePathname" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserDocument_userId_createdAt_idx" ON "UserDocument"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
