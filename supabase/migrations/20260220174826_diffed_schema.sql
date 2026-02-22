
  create table "public"."waitlist" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."waitlist" enable row level security;

CREATE UNIQUE INDEX waitlist_email_key ON public.waitlist USING btree (email);

CREATE UNIQUE INDEX waitlist_pkey ON public.waitlist USING btree (id);

alter table "public"."waitlist" add constraint "waitlist_pkey" PRIMARY KEY using index "waitlist_pkey";

alter table "public"."waitlist" add constraint "waitlist_email_key" UNIQUE using index "waitlist_email_key";

grant delete on table "public"."waitlist" to "anon";

grant insert on table "public"."waitlist" to "anon";

grant references on table "public"."waitlist" to "anon";

grant select on table "public"."waitlist" to "anon";

grant trigger on table "public"."waitlist" to "anon";

grant truncate on table "public"."waitlist" to "anon";

grant update on table "public"."waitlist" to "anon";

grant delete on table "public"."waitlist" to "authenticated";

grant insert on table "public"."waitlist" to "authenticated";

grant references on table "public"."waitlist" to "authenticated";

grant select on table "public"."waitlist" to "authenticated";

grant trigger on table "public"."waitlist" to "authenticated";

grant truncate on table "public"."waitlist" to "authenticated";

grant update on table "public"."waitlist" to "authenticated";

grant delete on table "public"."waitlist" to "service_role";

grant insert on table "public"."waitlist" to "service_role";

grant references on table "public"."waitlist" to "service_role";

grant select on table "public"."waitlist" to "service_role";

grant trigger on table "public"."waitlist" to "service_role";

grant truncate on table "public"."waitlist" to "service_role";

grant update on table "public"."waitlist" to "service_role";


  create policy "Admins can view waitlist"
  on "public"."waitlist"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Anyone can join the waitlist"
  on "public"."waitlist"
  as permissive
  for insert
  to public
with check (true);


CREATE TRIGGER send_welcome_email AFTER INSERT ON public.waitlist FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://zsgbjmttkdoptrpntglu.supabase.co/functions/v1/welcome-email', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZ2JqbXR0a2RvcHRycG50Z2x1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg1NzU4MiwiZXhwIjoyMDY4NDMzNTgyfQ.2Bdtfo8vs8t1qGrr5eCrgPco-KCxa5ueg3RODx9hPxU"}', '{}', '5000');

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_signup();


  create policy "Users can upload their own attachments"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'message-attachments'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can view attachments in their conversations"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'message-attachments'::text) AND (EXISTS ( SELECT 1
   FROM public.conversations
  WHERE (((conversations.id)::text = (storage.foldername(objects.name))[1]) AND ((conversations.landlord_id = auth.uid()) OR (conversations.tenant_id = auth.uid())))))));



  create policy "owners can delete their property photos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'property-photos'::text) AND (EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = (split_part(objects.name, '/'::text, 1))::uuid) AND (p.landlord_id = auth.uid()))))));



  create policy "owners can upload property photos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'property-photos'::text) AND ((storage.foldername(name))[1] IN ( SELECT (properties.id)::text AS id
   FROM public.properties
  WHERE (properties.landlord_id = auth.uid())))));



  create policy "public can read property photos"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'property-photos'::text));


-- CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();
--
-- CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();
--

