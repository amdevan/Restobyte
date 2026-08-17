-- AlterTable: Add employeeId column to User table (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'employeeId') THEN
    ALTER TABLE "User" ADD COLUMN "employeeId" TEXT;
  END IF;
END $$;
