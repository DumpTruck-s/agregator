-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifyCode" TEXT,
ADD COLUMN     "verifyCodeExp" TIMESTAMP(3);

-- Existing users are already verified
UPDATE "User" SET "emailVerified" = true;
