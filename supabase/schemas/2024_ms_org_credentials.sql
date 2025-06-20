-- Create ms_org_credentials table for secure, auditable org credential metadata (no secrets stored)
create table if not exists ms_org_credentials (
    id uuid primary key default gen_random_uuid(),
    org_id uuid references organizations(id) not null,
    secret_ref text not null, -- Reference to secret in Azure Key Vault
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table ms_org_credentials enable row level security;

-- Policy: Only org admins/owners can read/write their org's credentials
create policy "Allow org admin/owner read" on ms_org_credentials
    for select using (
        exists (
            select 1 from org_members m
            where m.org_id = ms_org_credentials.org_id
              and m.user_id = auth.uid()
              and m.role in ('admin', 'owner')
        )
    );

create policy "Allow org admin/owner insert" on ms_org_credentials
    for insert using (
        exists (
            select 1 from org_members m
            where m.org_id = ms_org_credentials.org_id
              and m.user_id = auth.uid()
              and m.role in ('admin', 'owner')
        )
    );

create policy "Allow org admin/owner update" on ms_org_credentials
    for update using (
        exists (
            select 1 from org_members m
            where m.org_id = ms_org_credentials.org_id
              and m.user_id = auth.uid()
              and m.role in ('admin', 'owner')
        )
    );

create policy "Allow org admin/owner delete" on ms_org_credentials
    for delete using (
        exists (
            select 1 from org_members m
            where m.org_id = ms_org_credentials.org_id
              and m.user_id = auth.uid()
              and m.role in ('admin', 'owner')
        )
    ); 