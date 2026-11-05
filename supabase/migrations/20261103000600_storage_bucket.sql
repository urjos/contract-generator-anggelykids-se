insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contract-documents',
  'contract-documents',
  false,
  52428800,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists contract_documents_storage_select_own on storage.objects;

create policy contract_documents_storage_select_own
on storage.objects for select
to authenticated
using (
  bucket_id = 'contract-documents'
  and array_length(storage.foldername(name), 1) >= 2
  and exists (
    select 1
    from public.contracts c
    where c.id::text = (storage.foldername(name))[1]
      and c.owner_id = (select auth.uid())
  )
);
