-- Add optional “source Word document” metadata to Material
ALTER TABLE "Material"
  ADD COLUMN "sourceDocPath" TEXT,
  ADD COLUMN "sourceDocOriginalName" TEXT,
  ADD COLUMN "sourceDocMimeType" TEXT,
  ADD COLUMN "sourceDocUpdatedAt" TIMESTAMP(3);

