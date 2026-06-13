-- Explicit Data API grants required since Supabase CLI v2.106.0
-- (auto_expose_new_tables now defaults to false)

GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";

GRANT ALL ON TABLE "public"."property_surveillance_declarations" TO "anon";
GRANT ALL ON TABLE "public"."property_surveillance_declarations" TO "authenticated";
GRANT ALL ON TABLE "public"."property_surveillance_declarations" TO "service_role";

GRANT ALL ON TABLE "public"."surveillance_reports" TO "anon";
GRANT ALL ON TABLE "public"."surveillance_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."surveillance_reports" TO "service_role";

GRANT ALL ON TABLE "public"."surveillance_report_photos" TO "anon";
GRANT ALL ON TABLE "public"."surveillance_report_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."surveillance_report_photos" TO "service_role";

GRANT ALL ON TABLE "public"."service_operator_profiles" TO "anon";
GRANT ALL ON TABLE "public"."service_operator_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."service_operator_profiles" TO "service_role";

GRANT ALL ON TABLE "public"."service_jobs" TO "anon";
GRANT ALL ON TABLE "public"."service_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."service_jobs" TO "service_role";

GRANT ALL ON TABLE "public"."service_job_applications" TO "anon";
GRANT ALL ON TABLE "public"."service_job_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."service_job_applications" TO "service_role";

GRANT ALL ON FUNCTION "public"."set_service_jobs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_service_jobs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_service_jobs_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."find_service_operators_near_job"("uuid", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."find_service_operators_near_job"("uuid", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_service_operators_near_job"("uuid", "text") TO "service_role";
