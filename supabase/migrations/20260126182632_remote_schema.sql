revoke delete on table "extensions"."spatial_ref_sys" from "postgres";

revoke insert on table "extensions"."spatial_ref_sys" from "postgres";

revoke references on table "extensions"."spatial_ref_sys" from "postgres";

revoke select on table "extensions"."spatial_ref_sys" from "postgres";

revoke trigger on table "extensions"."spatial_ref_sys" from "postgres";

revoke truncate on table "extensions"."spatial_ref_sys" from "postgres";

revoke update on table "extensions"."spatial_ref_sys" from "postgres";

drop type "extensions"."geometry_dump";

drop type "extensions"."valid_detail";

create type "extensions"."geometry_dump" as ("path" integer[], "geom" extensions.geometry);

create type "extensions"."valid_detail" as ("valid" boolean, "reason" character varying, "location" extensions.geometry);

revoke delete on table "public"."amenities" from "anon";

revoke insert on table "public"."amenities" from "anon";

revoke references on table "public"."amenities" from "anon";

revoke select on table "public"."amenities" from "anon";

revoke trigger on table "public"."amenities" from "anon";

revoke truncate on table "public"."amenities" from "anon";

revoke update on table "public"."amenities" from "anon";

revoke delete on table "public"."amenities" from "authenticated";

revoke insert on table "public"."amenities" from "authenticated";

revoke references on table "public"."amenities" from "authenticated";

revoke select on table "public"."amenities" from "authenticated";

revoke trigger on table "public"."amenities" from "authenticated";

revoke truncate on table "public"."amenities" from "authenticated";

revoke update on table "public"."amenities" from "authenticated";

revoke delete on table "public"."amenities" from "service_role";

revoke insert on table "public"."amenities" from "service_role";

revoke references on table "public"."amenities" from "service_role";

revoke select on table "public"."amenities" from "service_role";

revoke trigger on table "public"."amenities" from "service_role";

revoke truncate on table "public"."amenities" from "service_role";

revoke update on table "public"."amenities" from "service_role";

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

revoke delete on table "public"."bookings" from "anon";

revoke insert on table "public"."bookings" from "anon";

revoke references on table "public"."bookings" from "anon";

revoke select on table "public"."bookings" from "anon";

revoke trigger on table "public"."bookings" from "anon";

revoke truncate on table "public"."bookings" from "anon";

revoke update on table "public"."bookings" from "anon";

revoke delete on table "public"."bookings" from "authenticated";

revoke insert on table "public"."bookings" from "authenticated";

revoke references on table "public"."bookings" from "authenticated";

revoke select on table "public"."bookings" from "authenticated";

revoke trigger on table "public"."bookings" from "authenticated";

revoke truncate on table "public"."bookings" from "authenticated";

revoke update on table "public"."bookings" from "authenticated";

revoke delete on table "public"."bookings" from "service_role";

revoke insert on table "public"."bookings" from "service_role";

revoke references on table "public"."bookings" from "service_role";

revoke select on table "public"."bookings" from "service_role";

revoke trigger on table "public"."bookings" from "service_role";

revoke truncate on table "public"."bookings" from "service_role";

revoke update on table "public"."bookings" from "service_role";

revoke delete on table "public"."conversations" from "anon";

revoke insert on table "public"."conversations" from "anon";

revoke references on table "public"."conversations" from "anon";

revoke select on table "public"."conversations" from "anon";

revoke trigger on table "public"."conversations" from "anon";

revoke truncate on table "public"."conversations" from "anon";

revoke update on table "public"."conversations" from "anon";

revoke delete on table "public"."conversations" from "authenticated";

revoke insert on table "public"."conversations" from "authenticated";

revoke references on table "public"."conversations" from "authenticated";

revoke select on table "public"."conversations" from "authenticated";

revoke trigger on table "public"."conversations" from "authenticated";

revoke truncate on table "public"."conversations" from "authenticated";

revoke update on table "public"."conversations" from "authenticated";

revoke delete on table "public"."conversations" from "service_role";

revoke insert on table "public"."conversations" from "service_role";

revoke references on table "public"."conversations" from "service_role";

revoke select on table "public"."conversations" from "service_role";

revoke trigger on table "public"."conversations" from "service_role";

revoke truncate on table "public"."conversations" from "service_role";

revoke update on table "public"."conversations" from "service_role";

revoke delete on table "public"."messages" from "anon";

revoke insert on table "public"."messages" from "anon";

revoke references on table "public"."messages" from "anon";

revoke select on table "public"."messages" from "anon";

revoke trigger on table "public"."messages" from "anon";

revoke truncate on table "public"."messages" from "anon";

revoke update on table "public"."messages" from "anon";

revoke delete on table "public"."messages" from "authenticated";

revoke insert on table "public"."messages" from "authenticated";

revoke references on table "public"."messages" from "authenticated";

revoke select on table "public"."messages" from "authenticated";

revoke trigger on table "public"."messages" from "authenticated";

revoke truncate on table "public"."messages" from "authenticated";

revoke update on table "public"."messages" from "authenticated";

revoke delete on table "public"."messages" from "service_role";

revoke insert on table "public"."messages" from "service_role";

revoke references on table "public"."messages" from "service_role";

revoke select on table "public"."messages" from "service_role";

revoke trigger on table "public"."messages" from "service_role";

revoke truncate on table "public"."messages" from "service_role";

revoke update on table "public"."messages" from "service_role";

revoke delete on table "public"."notifications" from "anon";

revoke insert on table "public"."notifications" from "anon";

revoke references on table "public"."notifications" from "anon";

revoke select on table "public"."notifications" from "anon";

revoke trigger on table "public"."notifications" from "anon";

revoke truncate on table "public"."notifications" from "anon";

revoke update on table "public"."notifications" from "anon";

revoke delete on table "public"."notifications" from "authenticated";

revoke insert on table "public"."notifications" from "authenticated";

revoke references on table "public"."notifications" from "authenticated";

revoke select on table "public"."notifications" from "authenticated";

revoke trigger on table "public"."notifications" from "authenticated";

revoke truncate on table "public"."notifications" from "authenticated";

revoke update on table "public"."notifications" from "authenticated";

revoke delete on table "public"."notifications" from "service_role";

revoke insert on table "public"."notifications" from "service_role";

revoke references on table "public"."notifications" from "service_role";

revoke select on table "public"."notifications" from "service_role";

revoke trigger on table "public"."notifications" from "service_role";

revoke truncate on table "public"."notifications" from "service_role";

revoke update on table "public"."notifications" from "service_role";

revoke delete on table "public"."payments" from "anon";

revoke insert on table "public"."payments" from "anon";

revoke references on table "public"."payments" from "anon";

revoke select on table "public"."payments" from "anon";

revoke trigger on table "public"."payments" from "anon";

revoke truncate on table "public"."payments" from "anon";

revoke update on table "public"."payments" from "anon";

revoke delete on table "public"."payments" from "authenticated";

revoke insert on table "public"."payments" from "authenticated";

revoke references on table "public"."payments" from "authenticated";

revoke select on table "public"."payments" from "authenticated";

revoke trigger on table "public"."payments" from "authenticated";

revoke truncate on table "public"."payments" from "authenticated";

revoke update on table "public"."payments" from "authenticated";

revoke delete on table "public"."payments" from "service_role";

revoke insert on table "public"."payments" from "service_role";

revoke references on table "public"."payments" from "service_role";

revoke select on table "public"."payments" from "service_role";

revoke trigger on table "public"."payments" from "service_role";

revoke truncate on table "public"."payments" from "service_role";

revoke update on table "public"."payments" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

revoke delete on table "public"."properties" from "anon";

revoke insert on table "public"."properties" from "anon";

revoke references on table "public"."properties" from "anon";

revoke select on table "public"."properties" from "anon";

revoke trigger on table "public"."properties" from "anon";

revoke truncate on table "public"."properties" from "anon";

revoke update on table "public"."properties" from "anon";

revoke delete on table "public"."properties" from "authenticated";

revoke insert on table "public"."properties" from "authenticated";

revoke references on table "public"."properties" from "authenticated";

revoke select on table "public"."properties" from "authenticated";

revoke trigger on table "public"."properties" from "authenticated";

revoke truncate on table "public"."properties" from "authenticated";

revoke update on table "public"."properties" from "authenticated";

revoke delete on table "public"."properties" from "service_role";

revoke insert on table "public"."properties" from "service_role";

revoke references on table "public"."properties" from "service_role";

revoke select on table "public"."properties" from "service_role";

revoke trigger on table "public"."properties" from "service_role";

revoke truncate on table "public"."properties" from "service_role";

revoke update on table "public"."properties" from "service_role";

revoke delete on table "public"."property_amenities" from "anon";

revoke insert on table "public"."property_amenities" from "anon";

revoke references on table "public"."property_amenities" from "anon";

revoke select on table "public"."property_amenities" from "anon";

revoke trigger on table "public"."property_amenities" from "anon";

revoke truncate on table "public"."property_amenities" from "anon";

revoke update on table "public"."property_amenities" from "anon";

revoke delete on table "public"."property_amenities" from "authenticated";

revoke insert on table "public"."property_amenities" from "authenticated";

revoke references on table "public"."property_amenities" from "authenticated";

revoke select on table "public"."property_amenities" from "authenticated";

revoke trigger on table "public"."property_amenities" from "authenticated";

revoke truncate on table "public"."property_amenities" from "authenticated";

revoke update on table "public"."property_amenities" from "authenticated";

revoke delete on table "public"."property_amenities" from "service_role";

revoke insert on table "public"."property_amenities" from "service_role";

revoke references on table "public"."property_amenities" from "service_role";

revoke select on table "public"."property_amenities" from "service_role";

revoke trigger on table "public"."property_amenities" from "service_role";

revoke truncate on table "public"."property_amenities" from "service_role";

revoke update on table "public"."property_amenities" from "service_role";

revoke delete on table "public"."property_photos" from "anon";

revoke insert on table "public"."property_photos" from "anon";

revoke references on table "public"."property_photos" from "anon";

revoke select on table "public"."property_photos" from "anon";

revoke trigger on table "public"."property_photos" from "anon";

revoke truncate on table "public"."property_photos" from "anon";

revoke update on table "public"."property_photos" from "anon";

revoke delete on table "public"."property_photos" from "authenticated";

revoke insert on table "public"."property_photos" from "authenticated";

revoke references on table "public"."property_photos" from "authenticated";

revoke select on table "public"."property_photos" from "authenticated";

revoke trigger on table "public"."property_photos" from "authenticated";

revoke truncate on table "public"."property_photos" from "authenticated";

revoke update on table "public"."property_photos" from "authenticated";

revoke delete on table "public"."property_photos" from "service_role";

revoke insert on table "public"."property_photos" from "service_role";

revoke references on table "public"."property_photos" from "service_role";

revoke select on table "public"."property_photos" from "service_role";

revoke trigger on table "public"."property_photos" from "service_role";

revoke truncate on table "public"."property_photos" from "service_role";

revoke update on table "public"."property_photos" from "service_role";

revoke delete on table "public"."property_unavailable_dates" from "anon";

revoke insert on table "public"."property_unavailable_dates" from "anon";

revoke references on table "public"."property_unavailable_dates" from "anon";

revoke select on table "public"."property_unavailable_dates" from "anon";

revoke trigger on table "public"."property_unavailable_dates" from "anon";

revoke truncate on table "public"."property_unavailable_dates" from "anon";

revoke update on table "public"."property_unavailable_dates" from "anon";

revoke delete on table "public"."property_unavailable_dates" from "authenticated";

revoke insert on table "public"."property_unavailable_dates" from "authenticated";

revoke references on table "public"."property_unavailable_dates" from "authenticated";

revoke select on table "public"."property_unavailable_dates" from "authenticated";

revoke trigger on table "public"."property_unavailable_dates" from "authenticated";

revoke truncate on table "public"."property_unavailable_dates" from "authenticated";

revoke update on table "public"."property_unavailable_dates" from "authenticated";

revoke delete on table "public"."property_unavailable_dates" from "service_role";

revoke insert on table "public"."property_unavailable_dates" from "service_role";

revoke references on table "public"."property_unavailable_dates" from "service_role";

revoke select on table "public"."property_unavailable_dates" from "service_role";

revoke trigger on table "public"."property_unavailable_dates" from "service_role";

revoke truncate on table "public"."property_unavailable_dates" from "service_role";

revoke update on table "public"."property_unavailable_dates" from "service_role";

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

revoke delete on table "public"."user_roles" from "anon";

revoke insert on table "public"."user_roles" from "anon";

revoke references on table "public"."user_roles" from "anon";

revoke select on table "public"."user_roles" from "anon";

revoke trigger on table "public"."user_roles" from "anon";

revoke truncate on table "public"."user_roles" from "anon";

revoke update on table "public"."user_roles" from "anon";

revoke delete on table "public"."user_roles" from "authenticated";

revoke insert on table "public"."user_roles" from "authenticated";

revoke references on table "public"."user_roles" from "authenticated";

revoke select on table "public"."user_roles" from "authenticated";

revoke trigger on table "public"."user_roles" from "authenticated";

revoke truncate on table "public"."user_roles" from "authenticated";

revoke update on table "public"."user_roles" from "authenticated";

revoke delete on table "public"."user_roles" from "service_role";

revoke insert on table "public"."user_roles" from "service_role";

revoke references on table "public"."user_roles" from "service_role";

revoke select on table "public"."user_roles" from "service_role";

revoke trigger on table "public"."user_roles" from "service_role";

revoke truncate on table "public"."user_roles" from "service_role";

revoke update on table "public"."user_roles" from "service_role";

alter table "public"."bookings" drop constraint "bookings_status_check";

alter table "public"."notifications" drop constraint "notifications_type_check";

alter table "public"."application_documents" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."application_status_history" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."bookings" add column "declined_at" timestamp without time zone;

alter table "public"."conversations" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."messages" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."notifications" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."profiles" add column "stripe_customer_id" text;

alter table "public"."properties" alter column "location" set data type extensions.geography(Point,4326) using "location"::extensions.geography(Point,4326);

alter table "public"."property_unavailable_dates" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."rental_applications" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."bookings" add constraint "bookings_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'declined'::text, 'completed'::text]))) not valid;

alter table "public"."bookings" validate constraint "bookings_status_check";

alter table "public"."notifications" add constraint "notifications_type_check" CHECK ((type = ANY (ARRAY['booking_request'::text, 'booking_confirmed'::text, 'booking_cancelled'::text, 'booking_declined'::text, 'payment'::text, 'message'::text, 'system'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.raw_user_meta_data->>'avatar_url' is null or new.raw_user_meta_data->>'avatar_url' = '' then
    new.raw_user_meta_data = jsonb_set(new.raw_user_meta_data, '{avatar_url}', '"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"' :: jsonb);
  end if;
  insert into public.profiles (id, first_name, last_name, email, avatar_url)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', new.email, new.raw_user_meta_data->>'avatar_url');

  insert into public.user_roles (user_id, role)
  values (new.id, (new.raw_user_meta_data->>'user_role')::app_role);

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  property_title TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  IF OLD.status != NEW.status THEN
    -- Get property title
    SELECT title INTO property_title
    FROM properties
    WHERE id = NEW.property_id;
    
    -- Set notification based on status
    IF NEW.status = 'confirmed' THEN
      notification_title := 'Booking Confirmed';
      notification_message := 'Your booking for ' || property_title || ' has been confirmed!';
    ELSIF NEW.status = 'cancelled' THEN
      notification_title := 'Booking Cancelled';
      notification_message := 'Your booking for ' || property_title || ' has been cancelled.';
    ELSIF NEW.status = 'declined' THEN
      notification_title := 'Booking Declined';
      notification_message := 'Your booking for ' || property_title || ' has been declined.';
    END IF;
    
    -- Create notification for tenant
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.tenant_id,
      notification_title,
      notification_message,
      'booking_' || NEW.status,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_landlord_of_booking()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  prop_landlord_id UUID;
  property_title TEXT;
  tenant_name TEXT;
BEGIN
  -- Get landlord_id and property title
  SELECT p.landlord_id, p.title INTO prop_landlord_id, property_title
  FROM properties p
  WHERE p.id = NEW.property_id;
  
  -- Get tenant name
  SELECT first_name || ' ' || last_name INTO tenant_name
  FROM profiles
  WHERE id = NEW.tenant_id;
  
  -- Create notification for landlord
  INSERT INTO notifications (user_id, title, message, type, related_id)
  VALUES (
    prop_landlord_id,
    'New Booking Request',
    tenant_name || ' has requested to book ' || property_title,
    'booking_request',
    NEW.id
  );
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;


