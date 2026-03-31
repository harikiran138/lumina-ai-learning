ALTER TABLE public.enrollment_codes
ADD COLUMN IF NOT EXISTS section text,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS idx_enrollment_codes_batch_id ON public.enrollment_codes(batch_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_codes_code ON public.enrollment_codes(code);
