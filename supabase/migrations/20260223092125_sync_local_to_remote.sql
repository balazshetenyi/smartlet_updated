revoke delete on table "public"."application_documents" from "anon";

revoke insert on table "public"."application_documents" from "anon";

revoke references on table "public"."application_documents" from "anon";

revoke select on table "public"."application_documents" from "anon";

revoke trigger on table "public"."application_documents" from "anon";

revoke truncate on table "public"."application_documents" from "anon";

revoke update on table "public"."application_documents" from "anon";

revoke delete on table "public"."application_documents" from "authenticated";

revoke insert on table "public"."application_documents" from "authenticated";

revoke references on table "public"."application_documents" from "authenticated";

revoke select on table "public"."application_documents" from "authenticated";

revoke trigger on table "public"."application_documents" from "authenticated";

revoke truncate on table "public"."application_documents" from "authenticated";

revoke update on table "public"."application_documents" from "authenticated";

revoke delete on table "public"."application_documents" from "service_role";

revoke insert on table "public"."application_documents" from "service_role";

revoke references on table "public"."application_documents" from "service_role";

revoke select on table "public"."application_documents" from "service_role";

revoke trigger on table "public"."application_documents" from "service_role";

revoke truncate on table "public"."application_documents" from "service_role";

revoke update on table "public"."application_documents" from "service_role";

revoke delete on table "public"."application_status_history" from "anon";

revoke insert on table "public"."application_status_history" from "anon";

revoke references on table "public"."application_status_history" from "anon";

revoke select on table "public"."application_status_history" from "anon";

revoke trigger on table "public"."application_status_history" from "anon";

revoke truncate on table "public"."application_status_history" from "anon";

revoke update on table "public"."application_status_history" from "anon";

revoke delete on table "public"."application_status_history" from "authenticated";

revoke insert on table "public"."application_status_history" from "authenticated";

revoke references on table "public"."application_status_history" from "authenticated";

revoke select on table "public"."application_status_history" from "authenticated";

revoke trigger on table "public"."application_status_history" from "authenticated";

revoke truncate on table "public"."application_status_history" from "authenticated";

revoke update on table "public"."application_status_history" from "authenticated";

revoke delete on table "public"."application_status_history" from "service_role";

revoke insert on table "public"."application_status_history" from "service_role";

revoke references on table "public"."application_status_history" from "service_role";

revoke select on table "public"."application_status_history" from "service_role";

revoke trigger on table "public"."application_status_history" from "service_role";

revoke truncate on table "public"."application_status_history" from "service_role";

revoke update on table "public"."application_status_history" from "service_role";

revoke delete on table "public"."rental_applications" from "anon";

revoke insert on table "public"."rental_applications" from "anon";

revoke references on table "public"."rental_applications" from "anon";

revoke select on table "public"."rental_applications" from "anon";

revoke trigger on table "public"."rental_applications" from "anon";

revoke truncate on table "public"."rental_applications" from "anon";

revoke update on table "public"."rental_applications" from "anon";

revoke delete on table "public"."rental_applications" from "authenticated";

revoke insert on table "public"."rental_applications" from "authenticated";

revoke references on table "public"."rental_applications" from "authenticated";

revoke select on table "public"."rental_applications" from "authenticated";

revoke trigger on table "public"."rental_applications" from "authenticated";

revoke truncate on table "public"."rental_applications" from "authenticated";

revoke update on table "public"."rental_applications" from "authenticated";

revoke delete on table "public"."rental_applications" from "service_role";

revoke insert on table "public"."rental_applications" from "service_role";

revoke references on table "public"."rental_applications" from "service_role";

revoke select on table "public"."rental_applications" from "service_role";

revoke trigger on table "public"."rental_applications" from "service_role";

revoke truncate on table "public"."rental_applications" from "service_role";

revoke update on table "public"."rental_applications" from "service_role";

alter table "public"."application_documents" drop constraint "application_documents_application_id_fkey";

alter table "public"."application_documents" drop constraint "application_documents_document_type_check";

alter table "public"."application_documents" drop constraint "application_documents_uploaded_by_fkey";

alter table "public"."application_status_history" drop constraint "application_status_history_application_id_fkey";

alter table "public"."application_status_history" drop constraint "application_status_history_changed_by_fkey";

alter table "public"."rental_applications" drop constraint "rental_applications_landlord_id_fkey";

alter table "public"."rental_applications" drop constraint "rental_applications_property_id_fkey";

alter table "public"."rental_applications" drop constraint "rental_applications_status_check";

alter table "public"."rental_applications" drop constraint "rental_applications_tenant_id_fkey";

alter table "public"."application_documents" drop constraint "application_documents_pkey";

alter table "public"."application_status_history" drop constraint "application_status_history_pkey";

alter table "public"."rental_applications" drop constraint "rental_applications_pkey";

drop index if exists "public"."application_documents_pkey";

drop index if exists "public"."application_status_history_pkey";

drop index if exists "public"."rental_applications_pkey";

drop table "public"."application_documents";

drop table "public"."application_status_history";

drop table "public"."rental_applications";


alter table "public"."waitlist" enable row level security;

alter table "public"."amenities" enable row level security;

alter table "public"."profiles" enable row level security;

alter table "public"."property_amenities" enable row level security;

alter table "public"."user_roles" enable row level security;



  create policy "Allow read access to amenities for authenticated users"
  on "public"."amenities"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Landlords can update status of bookings for their properties"
  on "public"."bookings"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = bookings.property_id) AND (properties.landlord_id = auth.uid())))));



  create policy "Landlords can view and update bookings for their properties"
  on "public"."bookings"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = bookings.property_id) AND (properties.landlord_id = auth.uid())))));



  create policy "Tenants can view and manage their own bookings"
  on "public"."bookings"
  as permissive
  for all
  to authenticated
using ((tenant_id = auth.uid()))
with check ((tenant_id = auth.uid()));



  create policy "Enable users to view their own data only"
  on "public"."notifications"
  as permissive
  for all
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can view payments related to their bookings"
  on "public"."payments"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.bookings
     LEFT JOIN public.properties ON ((properties.id = bookings.property_id)))
  WHERE ((bookings.id = payments.booking_id) AND ((bookings.tenant_id = auth.uid()) OR (properties.landlord_id = auth.uid()))))));



  create policy "Anyone can view user profile"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable delete for users based on user_id"
  on "public"."profiles"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = id));



  create policy "Enable insert for authenticated users only"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Policy with table joins"
  on "public"."profiles"
  as permissive
  for update
  to public
using (( SELECT (auth.uid() = profiles.id)));



  create policy "Allow read access to property_amenities for authenticated users"
  on "public"."property_amenities"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Landlords can manage amenities for their own properties"
  on "public"."property_amenities"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = property_amenities.property_id) AND (properties.landlord_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = property_amenities.property_id) AND (properties.landlord_id = auth.uid())))));



  create policy "Users can view their own roles"
  on "public"."user_roles"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));





