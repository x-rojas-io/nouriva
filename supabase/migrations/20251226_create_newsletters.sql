-- Create Newsletters table for history
CREATE TABLE IF NOT EXISTS newsletters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    subject TEXT NOT NULL,
    intro TEXT,
    recipes JSONB, -- Store the snapshot of recipes included
    status TEXT DEFAULT 'draft', -- 'draft', 'sent'
    sent_at TIMESTAMPTZ,
    recipient_count INTEGER DEFAULT 0
);

-- RLS: Only admins can manage newsletters
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with newsletters"
    ON newsletters
    FOR ALL
    USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );
