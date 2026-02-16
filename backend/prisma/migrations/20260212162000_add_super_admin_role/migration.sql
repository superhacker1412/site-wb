DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum enum_value
    JOIN pg_type enum_type ON enum_type.oid = enum_value.enumtypid
    WHERE enum_type.typname = 'UserRole'
      AND enum_value.enumlabel = 'SUPER_ADMIN'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';
  END IF;
END $$;
