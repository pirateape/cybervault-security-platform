-- Migration: Add triggers for automatic rule versioning on INSERT/UPDATE

-- Function to insert into rule_versions
create or replace function public.insert_rule_version()
returns trigger as $$
begin
  insert into public.rule_versions (
    rule_id, version, content, created_by, created_at, metadata
  ) values (
    NEW.id,
    coalesce(NEW.version, '1'),
    to_jsonb(NEW),
    NEW.created_by,
    now(),
    jsonb_build_object('event', TG_OP)
  );
  return NEW;
end;
$$ language plpgsql;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS trg_rule_version_insert ON public.rules;
DROP TRIGGER IF EXISTS trg_rule_version_update ON public.rules;

-- Create triggers for insert and update
create trigger trg_rule_version_insert
  after insert on public.rules
  for each row execute function public.insert_rule_version();

create trigger trg_rule_version_update
  after update on public.rules
  for each row execute function public.insert_rule_version(); 