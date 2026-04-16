-- Migration 034: BKT+DKT hybrid mastery columns on skill_mastery table
-- Lumina AI LMS — Section C2
-- BKT produces p_know; DKT produces predicted_performance.
-- hybrid_mastery = 0.6 * bkt_p_know + 0.4 * dkt_predicted (stored computed column).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'skill_mastery'
  ) THEN
    -- bkt_p_know: Bayesian Knowledge Tracing probability of knowing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'skill_mastery' AND column_name = 'bkt_p_know'
    ) THEN
      ALTER TABLE skill_mastery
        ADD COLUMN bkt_p_know FLOAT CHECK (bkt_p_know BETWEEN 0 AND 1);
    END IF;

    -- dkt_predicted: Deep Knowledge Tracing sequence-based prediction
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'skill_mastery' AND column_name = 'dkt_predicted'
    ) THEN
      ALTER TABLE skill_mastery
        ADD COLUMN dkt_predicted FLOAT CHECK (dkt_predicted BETWEEN 0 AND 1);
    END IF;

    -- hybrid_mastery: weighted combination — what the UI always displays
    -- Postgres generated columns cannot reference other columns with expressions using functions,
    -- so we use a regular column updated by the application layer on every write.
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'skill_mastery' AND column_name = 'hybrid_mastery'
    ) THEN
      ALTER TABLE skill_mastery
        ADD COLUMN hybrid_mastery FLOAT
          GENERATED ALWAYS AS (
            CASE
              WHEN bkt_p_know IS NOT NULL AND dkt_predicted IS NOT NULL
              THEN 0.6 * bkt_p_know + 0.4 * dkt_predicted
              WHEN bkt_p_know IS NOT NULL THEN bkt_p_know
              WHEN dkt_predicted IS NOT NULL THEN dkt_predicted
              ELSE NULL
            END
          ) STORED;
    END IF;
  END IF;
END
$$;

-- Also rename any legacy FSRS parameter columns from SM-2 naming to FSRS v5 naming
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'spaced_repetition_cards'
  ) THEN
    -- Rename sm2_interval → fsrs_stability if old column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'spaced_repetition_cards' AND column_name = 'sm2_interval'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'spaced_repetition_cards' AND column_name = 'fsrs_stability'
    ) THEN
      ALTER TABLE spaced_repetition_cards RENAME COLUMN sm2_interval TO fsrs_stability;
    END IF;

    -- Rename sm2_ease_factor → fsrs_difficulty if old column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'spaced_repetition_cards' AND column_name = 'sm2_ease_factor'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'spaced_repetition_cards' AND column_name = 'fsrs_difficulty'
    ) THEN
      ALTER TABLE spaced_repetition_cards RENAME COLUMN sm2_ease_factor TO fsrs_difficulty;
    END IF;

    -- Add FSRS v5 columns if not present
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'spaced_repetition_cards' AND column_name = 'fsrs_stability'
    ) THEN
      ALTER TABLE spaced_repetition_cards ADD COLUMN fsrs_stability FLOAT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'spaced_repetition_cards' AND column_name = 'fsrs_difficulty'
    ) THEN
      ALTER TABLE spaced_repetition_cards ADD COLUMN fsrs_difficulty FLOAT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'spaced_repetition_cards' AND column_name = 'fsrs_retrievability'
    ) THEN
      ALTER TABLE spaced_repetition_cards ADD COLUMN fsrs_retrievability FLOAT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'spaced_repetition_cards' AND column_name = 'algorithm'
    ) THEN
      ALTER TABLE spaced_repetition_cards ADD COLUMN algorithm TEXT DEFAULT 'fsrs_v5';
    END IF;
  END IF;
END
$$;
