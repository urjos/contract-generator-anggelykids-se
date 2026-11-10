-- The owner edits brand settings from the app's Ajustes screen.
-- RLS policies already restrict rows to the authenticated owner and id = 1.
grant select, insert, update on table public.brand_settings to authenticated;
