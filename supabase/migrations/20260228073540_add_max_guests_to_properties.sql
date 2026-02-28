alter table "public"."properties"
    add column "max_guests" integer not null default 1;

comment on column "public"."properties"."max_guests" is 'Maximum number of guests allowed for this property';
