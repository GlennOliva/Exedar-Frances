create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  must_change_password boolean not null default true,
  password_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.admin_users force row level security;
revoke all on table public.admin_users from public, anon, authenticated;
grant all on table public.admin_users to service_role;

create index if not exists rsvps_created_at_admin on public.rsvps (created_at desc);
create index if not exists rsvps_name_admin on public.rsvps (lower(last_name), lower(first_name));
create index if not exists rsvps_attendance_admin on public.rsvps (attendance, reminder_consent);
