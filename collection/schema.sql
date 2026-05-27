-- Payment Collection Supabase schema
-- Run this in the Supabase SQL editor. 

create extension if not exists "pgcrypto";

-- 1. Create table if it doesn't exist
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  invoice_amount numeric(12, 2) not null default 0,
  outstanding numeric(12, 2) not null default 0,
  received_amount numeric(12, 2) not null default 0,
  delay_days integer not null default 0,
  payment_terms_days integer not null default 30,
  reminder_stage text not null default 'none',
  due_date date,
  received_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. If table ALREADY existed, we need to make sure the columns are added
alter table public.customers
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists invoice_amount numeric(12, 2) not null default 0,
  add column if not exists outstanding numeric(12, 2) not null default 0,
  add column if not exists received_amount numeric(12, 2) not null default 0,
  add column if not exists delay_days integer not null default 0,
  add column if not exists payment_terms_days integer not null default 30,
  add column if not exists reminder_stage text not null default 'none',
  add column if not exists due_date date,
  add column if not exists received_date date,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- 3. Add Constraints
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'customers_name_not_empty') then
    alter table public.customers add constraint customers_name_not_empty check (length(trim(name)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'customers_outstanding_not_negative') then
    alter table public.customers add constraint customers_outstanding_not_negative check (outstanding >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'customers_reminder_stage_check') then
    alter table public.customers add constraint customers_reminder_stage_check check (
      reminder_stage in ('none', 'cold', 'business_formal', 'formal_polite', 'polite_harsh')
    );
  end if;
end;
$$;

-- 4. Create Index
create index if not exists customers_user_created_at_idx
  on public.customers (user_id, created_at desc);

-- 5. Set up updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_customers_updated_at on public.customers;

create trigger set_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

-- 6. Enable RLS and setup policies
alter table public.customers enable row level security;

drop policy if exists "Users can view their own customers" on public.customers;
drop policy if exists "Users can insert their own customers" on public.customers;
drop policy if exists "Users can update their own customers" on public.customers;
drop policy if exists "Users can delete their own customers" on public.customers;

create policy "Users can view their own customers"
on public.customers
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own customers"
on public.customers
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own customers"
on public.customers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own customers"
on public.customers
for delete
to authenticated
using (auth.uid() = user_id);

-- ==========================================
-- 7. Transactions History & Audit Log
-- ==========================================

-- Create transactions table to log individual payment entries and invoice additions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  type text not null check (type in ('invoice', 'payment')),
  amount numeric(12, 2) not null check (amount > 0),
  transaction_date date not null,
  created_at timestamptz not null default now()
);

-- Index customer_id for high-performance joins when fetching transaction history
create index if not exists transactions_customer_id_idx 
  on public.transactions (customer_id);

-- Enable Row Level Security (RLS) on transactions
alter table public.transactions enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can view transactions for their own customers" on public.transactions;
drop policy if exists "Users can insert transactions for their own customers" on public.transactions;
drop policy if exists "Users can update transactions for their own customers" on public.transactions;
drop policy if exists "Users can delete transactions for their own customers" on public.transactions;

-- RLS Policy: View transactions only if they belong to a customer owned by the user
create policy "Users can view transactions for their own customers"
on public.transactions
for select
to authenticated
using (
  exists (
    select 1 from public.customers c
    where c.id = customer_id and c.user_id = auth.uid()
  )
);

-- RLS Policy: Insert transaction logs only for a customer owned by the user
create policy "Users can insert transactions for their own customers"
on public.transactions
for insert
to authenticated
with check (
  exists (
    select 1 from public.customers c
    where c.id = customer_id and c.user_id = auth.uid()
  )
);

-- RLS Policy: Update logs only for customers owned by the user
create policy "Users can update transactions for their own customers"
on public.transactions
for update
to authenticated
using (
  exists (
    select 1 from public.customers c
    where c.id = customer_id and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.customers c
    where c.id = customer_id and c.user_id = auth.uid()
  )
);

-- RLS Policy: Delete logs only for customers owned by the user
create policy "Users can delete transactions for their own customers"
on public.transactions
for delete
to authenticated
using (
  exists (
    select 1 from public.customers c
    where c.id = customer_id and c.user_id = auth.uid()
  )
);