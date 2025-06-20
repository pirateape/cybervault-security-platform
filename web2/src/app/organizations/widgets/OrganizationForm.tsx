import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button, Card } from '../../../../../libs/ui/primitives';
import { FormError } from './SharedComponents';

const OrganizationSchema = z.object({
  name: z.string().min(2, { message: 'Name is required and must be at least 2 characters.' }),
  slug: z.string().min(2, { message: 'Slug is required and must be at least 2 characters.' }),
});

type OrganizationFormValues = z.infer<typeof OrganizationSchema>;

interface OrganizationFormProps {
  initialValues?: Partial<OrganizationFormValues>;
  onSubmit: (values: OrganizationFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export function OrganizationForm({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  error,
}: OrganizationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(OrganizationSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  React.useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-label="Organization form" className="w-full max-w-md mx-auto">
      <Card className="flex flex-col gap-4 p-4">
        <div className="w-full">
          <label htmlFor="name" className="font-medium mb-1 block">Organization Name</label>
          <Input
            id="name"
            type="text"
            autoFocus
            aria-invalid={!!errors.name}
            aria-describedby="org-name-error"
            {...register('name')}
            disabled={loading || isSubmitting}
          />
          {errors.name && (
            <span id="org-name-error" className="text-error text-xs mt-1">
              {errors.name.message}
            </span>
          )}
        </div>
        <div className="w-full">
          <label htmlFor="slug" className="font-medium mb-1 block">Organization Slug</label>
          <Input
            id="slug"
            type="text"
            aria-invalid={!!errors.slug}
            aria-describedby="org-slug-error"
            {...register('slug')}
            disabled={loading || isSubmitting}
          />
          {errors.slug && (
            <span id="org-slug-error" className="text-error text-xs mt-1">
              {errors.slug.message}
            </span>
          )}
        </div>
        {error && <FormError error={error} />}
        <div className="flex gap-2 justify-end mt-4">
          <Button type="button" variant="ghost" colorScheme="secondary" onClick={onCancel} disabled={loading || isSubmitting}>Cancel</Button>
          <Button type="submit" variant="solid" colorScheme="primary" disabled={loading || isSubmitting} aria-busy={loading || isSubmitting}>{loading || isSubmitting ? 'Saving...' : 'Save'}</Button>
        </div>
      </Card>
    </form>
  );
} 