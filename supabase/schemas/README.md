# supabase/schemas

This directory contains declarative SQL schema files for your Supabase/Postgres project.

- Each file defines tables, relationships, and constraints for a logical group of entities.
- Files are executed in lexicographic order by Supabase CLI migrations, so prefix with numbers (e.g., `001_`, `002_`).
- To apply these schemas to your local or remote Supabase project, use the Supabase CLI:

```bash
supabase db push
```

- To generate a migration from changes, use:

```bash
supabase db diff -f <migration_name>
```

- To start your local Supabase instance and apply migrations:

```bash
supabase start && supabase migration up
```

- For more info, see the [Supabase docs](https://supabase.com/docs/guides/database).
