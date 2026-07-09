ALTER TABLE emails ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'normal', 'high')) DEFAULT 'normal';
ALTER TABLE emails ADD COLUMN IF NOT EXISTS read_receipt BOOLEAN DEFAULT FALSE;
