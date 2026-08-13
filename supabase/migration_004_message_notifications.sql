-- Unread-message notifications: track read state per message and let the
-- receiver mark their own messages read; enable Realtime so the header
-- badge can update live without a page reload.

alter table public.messages add column if not exists read_at timestamptz;

create policy "receiver can mark messages read"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

alter publication supabase_realtime add table public.messages;
