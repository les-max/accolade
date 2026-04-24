CREATE TABLE show_performances (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id    UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('performance', 'audition', 'callback')),
  date       DATE NOT NULL,
  start_time TIME,
  label      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_show_performances_show_id ON show_performances(show_id);
CREATE INDEX idx_show_performances_date    ON show_performances(date);
