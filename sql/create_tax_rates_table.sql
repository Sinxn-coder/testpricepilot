-- ─── STEP 2: CREATE TAX RATES TABLE ──────────────────────────────────────────

-- 1. Create the tax_rates table
create table if not exists public.tax_rates (
  country_code text primary key,             -- ISO alpha-2 code (e.g., 'US')
  country_name text not null,                -- Full name (e.g., 'United States')
  tax_percentage numeric(5, 2) not null,     -- e.g., 20.00
  tax_type text not null default 'VAT',      -- VAT, GST, Sales Tax, etc.
  updated_at timestamptz not null default now()
);

-- 2. Add trigger for updated_at
create trigger set_tax_rates_updated_at
before update on public.tax_rates
for each row
execute function public.handle_updated_at();

-- 3. Enable RLS
alter table public.tax_rates enable row level security;

-- 4. Public access (read-only)
-- Tax rates are usually public data for the API to consume.
create policy "Allow public read access" 
  on public.tax_rates 
  for select 
  using (true);

-- 5. Seed with 2024/2025 real-time data
insert into public.tax_rates (country_code, country_name, tax_percentage, tax_type)
values
  ('IN', 'India', 18.00, 'GST'),
  ('GB', 'United Kingdom', 20.00, 'VAT'),
  ('DE', 'Germany', 19.00, 'VAT'),
  ('FR', 'France', 20.00, 'VAT'),
  ('JP', 'Japan', 10.00, 'Consumption Tax'),
  ('SG', 'Singapore', 9.00, 'GST'),
  ('AU', 'Australia', 10.00, 'GST'),
  ('AE', 'United Arab Emirates', 5.00, 'VAT'),
  ('CA', 'Canada', 5.00, 'GST'),
  ('MX', 'Mexico', 16.00, 'IVA'),
  ('ZA', 'South Africa', 15.00, 'VAT'),
  ('US', 'United States', 8.00, 'Sales Tax') -- Representative state average
on conflict (country_code) do update
set 
  tax_percentage = excluded.tax_percentage,
  updated_at = now();
