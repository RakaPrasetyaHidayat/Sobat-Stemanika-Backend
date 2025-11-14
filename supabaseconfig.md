# Supabase Configuration Guide

Purpose: configure your Supabase database (tables, constraints and Row Level Security policies) to support these features:

- Admins can create / update / delete `Eskul` records.
- All authenticated users (any role) can cast a vote.
- Each authenticated user may cast only one vote (enforced by database constraint + RLS).
- Users can edit *their own* profile, while admins can manage users.

This document contains SQL you can copy/paste into the Supabase SQL editor (Dashboard → SQL Editor → New query) and run.

---

Important notes (read before applying):

- This guide assumes you use Supabase Auth and that application users are signed in using Supabase Auth. Policies use `auth.uid()` which is the authenticated user's id (the `sub` from the Supabase access token).
- If you do NOT use Supabase Auth and instead use your own authentication (custom JWTs signed by the app), RLS policies that rely on `auth.uid()` will not work unless Supabase is configured to decode your tokens. In that case prefer server-side enforcement.
- Backup your database before running schema changes.

---

Overview of the SQL below:

1. Add `supabase_id` column to `Users` to link app users to Supabase auth users.
2. Add `supabase_user_id` to `vote` table and enforce uniqueness so each supabase user can vote only once.
3. Add foreign keys and indexes where helpful.
4. Enable Row Level Security (RLS) and create policies:
   - `Users`: users can update their own profile; admins can do more.
   - `Eskul`: admins can INSERT/UPDATE/DELETE; authenticated users can SELECT.
   - `vote`: authenticated users may INSERT only if they haven't voted yet; users can SELECT their own vote; admins can inspect everything.
5. Optional helper function `is_admin()` to check admin role via `Users.role`.

Copy & paste the blocks in order.

---

1) Add helper function to detect admin (uses `Users.role` stored in your `Users` table)

```sql
-- Create a helper function to test if current authenticated Supabase user is an admin
create or replace function public.is_admin()
returns boolean stable
language sql
as $$
  select exists(
    select 1
    from public."Users" u
    where u.supabase_id = auth.uid() and u.role = 'admin'
  );
$$;

-- Grant usage to authenticated role (optional, defaults ok).
grant execute on function public.is_admin() to authenticated;
```

Notes:
- This function reads the `Users.role` column. Make sure your `Users` table contains a `role` column (string) and that admin accounts have `role = 'admin'`.

---

2) Add `supabase_id` to `Users` (link to `auth.users` id) and protect it

```sql
-- Add column if it does not exist
alter table if exists public."Users"
  add column if not exists supabase_id uuid;

-- Optionally create index for faster lookups
create index if not exists idx_users_supabase_id on public."Users" (supabase_id);

-- (Optional) Add a foreign key to auth.users (supabase internal schema). This is optional and may be refused for some managed configs.
-- If it errors, skip the foreign key and rely on the value matching auth.uid().
begin;
  alter table if exists public."Users"
    add constraint if not exists fk_users_supabase_id
    foreign key (supabase_id) references auth.users(id) on delete set null;
exception when others then
  -- ignore if referential constraint cannot be created in this project
  rollback;
end;
/
```

After running this, ensure your application stores the Supabase Auth `user.id` in `Users.supabase_id` when a user registers or logs in.

---

3) Ensure `vote` table stores the supabase user id and enforce one vote per user

```sql
-- Add supabase_user_id column to vote table (if not present)
alter table if exists public."vote"
  add column if not exists supabase_user_id uuid;

-- Add index and unique constraint so each supabase user can have only one vote
-- This enforces one vote per authenticated user globally.
create unique index if not exists idx_unique_vote_per_user on public."vote" (supabase_user_id);

-- If your application logic wishes one vote per user per "election" or per type, change the unique index column set accordingly (e.g. (supabase_user_id, election_id)).

-- Add an index to target id for results queries
create index if not exists idx_vote_target_id on public."vote" (target_id);
```

Notes:
- The `supabase_user_id` should be set on INSERT by your client/server code to the current auth user's id (auth.user().id in supabase-js) or you can use a Postgres function to enforce it server-side.

---

4) Make sure foreign keys exist / clean schema

```sql
-- If target_id references kandidat table, add FK
alter table if exists public."vote"
  add constraint if not exists fk_vote_target_kandidat
  foreign key (target_id) references public."Kandidat" (id) on delete cascade;

-- If the application uses Users.id as the DB owner and vote.user_id references it, keep it but prefer supabase_user_id for RLS checks
alter table if exists public."vote"
  add constraint if not exists fk_vote_user
  foreign key (user_id) references public."Users" (id) on delete cascade;
```

---

5) Enable Row Level Security and policies

A. Policies for `Users` table – allow users to update their own profile and allow admins to manage users

```sql
-- Enable RLS on Users
alter table if exists public."Users" enable row level security;

-- Policy: authenticated users can SELECT their own row
create policy if not exists "users_select_own_or_admin" on public."Users"
  for select
  using (
    supabase_id = auth.uid() or public.is_admin()
  );

-- Policy: users can update their own profile
create policy if not exists "users_update_own" on public."Users"
  for update
  using (supabase_id = auth.uid())
  with check (supabase_id = auth.uid());

-- Policy: admins can do everything on Users
create policy if not exists "users_admin_all" on public."Users"
  for all
  using (public.is_admin())
  with check (public.is_admin());
```

Notes:
- `for all` policy used above is broad: depending on Supabase version you might want to create separate INSERT/DELETE/UPDATE policies for admins. The `users_admin_all` policy allows admin to insert/update/delete rows if `is_admin()` returns true.

B. Policies for `Eskul` table – only admins can create/modify; everyone can read

```sql
-- Enable RLS on Eskul
alter table if exists public."Eskul" enable row level security;

-- Policy: public authenticated users can SELECT Eskul
create policy if not exists "eskul_select" on public."Eskul"
  for select
  using (true);

-- Policy: admins can INSERT into Eskul
create policy if not exists "eskul_insert_admin" on public."Eskul"
  for insert
  with check (public.is_admin());

-- Policy: admins can UPDATE Eskul
create policy if not exists "eskul_update_admin" on public."Eskul"
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Policy: admins can DELETE Eskul
create policy if not exists "eskul_delete_admin" on public."Eskul"
  for delete
  using (public.is_admin());
```

C. Policies for `vote` table – authenticated users can insert a single vote, users can read their own vote, admins can read all votes

```sql
-- Enable RLS on vote
alter table if exists public."vote" enable row level security;

-- Policy: allow authenticated users to insert a vote only if they have not voted before
create policy if not exists "vote_insert_once" on public."vote"
  for insert
  with check (
    auth.uid() is not null
    and new.supabase_user_id = auth.uid()
    and not exists (
      select 1 from public."vote" v where v.supabase_user_id = auth.uid()
    )
  );

-- Policy: Let users select their own vote
create policy if not exists "vote_select_own" on public."vote"
  for select
  using (supabase_user_id = auth.uid() or public.is_admin());

-- Policy: admins can select/insert/update/delete all votes
create policy if not exists "vote_admin_all" on public."vote"
  for all
  using (public.is_admin())
  with check (public.is_admin());
```

Important notes about the `vote_insert_once` policy:
- The `with check` expression compares `new.supabase_user_id` to `auth.uid()` and checks there is no existing vote for `auth.uid()`.
- The uniqueness constraint created earlier (`idx_unique_vote_per_user`) also protects against race conditions but you should handle duplicate-key errors in application logic.

---

6) (Optional) Create a helper SQL function to cast a vote safely (recommended if you want server-side enforcement)

If you prefer to let the database handle insertion logic (and avoid client needing to set `supabase_user_id` explicitly), create a function that inserts the vote using `auth.uid()` and returns a helpful error on duplicate.

```sql
create or replace function public.cast_vote(kandidat uuid, vote_type int)
returns table(id uuid, user_id uuid, target_id uuid, supabase_user_id uuid, created_at timestamptz)
language plpgsql security definer
as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  -- Check existing vote
  if exists (select 1 from public."vote" v where v.supabase_user_id = auth.uid()) then
    raise exception 'user_has_already_voted';
  end if;

  return query
  insert into public."vote" (user_id, target_id, supabase_user_id, vote_type)
  values (null, kandidat, auth.uid(), vote_type)
  returning id, user_id, target_id, supabase_user_id, created_at;
end;
$$;

-- Grant execute on function to authenticated users
grant execute on function public.cast_vote(uuid, int) to authenticated;
```

Notes:
- `security definer` means this function executes with the privileges of the owner (usually postgres). Use with care: ensure the function does not allow escalation (we check `auth.uid()` inside).
- The function inserts a vote with `supabase_user_id = auth.uid()` ignoring client-supplied supabase_user_id. This avoids the client needing to pass the id explicitly and is safest for RLS.

---

7) Application integration notes (what to change in your backend/client)

- When users sign up or login with Supabase Auth, store the Supabase `user.id` into `Users.supabase_id` for that row. This allows `is_admin()` to map Supabase auth user → application user role.

  Example (Node/supabase-js):
  ```js
  const { data: { user } } = await supabase.auth.signUp({ email, password });
  // user.id is the supabase auth id
  // create Users row and store supabase_id = user.id
  ```

- To cast a vote from the client with Supabase client (recommended):
  ```js
  const user = supabase.auth.user();
  // Option A: call DB function (recommended)
  const { data, error } = await supabase.rpc('cast_vote', { kandidat: targetId, vote_type: 1 });

  // Option B: insert directly (client must include supabase_user_id = user.id)
  const { data, error } = await supabase.from('vote').insert([{ target_id: targetId, supabase_user_id: user.id, vote_type: 1 }]);
  ```

- Handle duplicate vote errors gracefully in the client (e.g., show "Anda sudah memilih"). A duplicate insert will either be blocked by the policy or fail by the unique index.

- For admin operations (add Eskul, update Kandidat), either:
  - Use Supabase Auth with admin accounts (role = 'admin' in `Users` table) and call as authenticated user; policies will permit admin actions.
  - Or perform these actions from your backend server using the Supabase service role key (service key bypasses RLS). If you use the service key in the server, keep it secret and never expose in frontend.

---

8) Rollback notes

If something goes wrong you can:
- Drop indexes or constraints created here
- Disable RLS: `alter table public."vote" disable row level security;`
- Recreate previous schema from backups

---

9) Summary checklist (what to run/copy)

- Run the SQL blocks above in this order:
  1. `is_admin()` function
  2. Add `supabase_id` to `Users`
  3. Add `supabase_user_id` to `vote` and unique index
  4. Foreign keys (optional)
  5. Enable RLS and create policies
  6. (Optional) `cast_vote` function

- Update your application to:
  - Use Supabase Auth and persist `user.id` to `Users.supabase_id`.
  - Call `cast_vote` RPC or include `supabase_user_id` when inserting into `vote`.
  - Ensure admin users have `role = 'admin'` in `Users` table.

---

If you want, I can:
- Generate the exact SQL as a single copy/paste script combining the blocks above (ready to run),
- Or produce a minimal migration SQL tailored to your current schema (I can inspect current table definitions and produce ALTER statements exactly matching your database).

Which would you like me to do next?