import React from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MonacoEditorWidget } from './MonacoEditorWidget';
import { Button, Card, Input } from '../../../../../libs/ui/primitives';

// Zod schema for rule metadata and code
const RuleSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  description: z.string().optional(),
  code: z.string().min(1, 'Rule code is required.'),
});

type RuleFormValues = z.infer<typeof RuleSchema>;

export interface RuleFormDialogProps {
  open: boolean;
  onClose: () => void;
  initialRule?: Partial<RuleFormValues>;
  onSubmit: (values: RuleFormValues) => void;
  loading?: boolean;
}

// Modular, accessible RuleFormDialog for create/edit
export const RuleFormDialog: React.FC<RuleFormDialogProps> = ({
  open,
  onClose,
  initialRule = {},
  onSubmit,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<RuleFormValues>({
    resolver: zodResolver(RuleSchema),
    defaultValues: {
      name: initialRule.name || '',
      description: initialRule.description || '',
      code: initialRule.code || '',
    },
    mode: 'onChange',
  });

  // Watch code for MonacoEditorWidget
  const code = watch('code');

  // Handle Monaco editor changes
  const handleCodeChange = (val: string) => setValue('code', val, { shouldValidate: true });

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <Card className="p-6 shadow-lg w-full max-w-2xl mx-auto" role="dialog" aria-modal="true">
        <h2 className="font-bold text-lg mb-2">{initialRule?.name ? 'Edit Rule' : 'Create Rule'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="rule-name" className="block font-medium mb-1">Name</label>
            <Input
              id="rule-name"
              {...register('name')}
              aria-invalid={!!errors.name}
              aria-describedby="rule-name-error"
              autoFocus
              className="w-full"
            />
            {errors.name?.message && <div className="alert alert-error mt-1" id="rule-name-error">{errors.name.message}</div>}
          </div>
          <div>
            <label htmlFor="rule-description" className="block font-medium mb-1">Description</label>
            <textarea
              id="rule-description"
              {...register('description')}
              aria-invalid={!!errors.description}
              aria-describedby="rule-description-error"
              rows={2}
              className="w-full input input-bordered"
            />
            {errors.description?.message && <div className="alert alert-error mt-1" id="rule-description-error">{errors.description.message}</div>}
          </div>
          <div>
            <label htmlFor="rule-code" className="block font-medium mb-1">Rule Code</label>
            <MonacoEditorWidget
              value={code}
              language="typescript"
              onChange={handleCodeChange}
              ariaLabel="Rule code editor"
              height={300}
              localStorageKey={initialRule?.name ? `rule-draft-${initialRule.name}` : 'rule-draft-new'}
            />
            {errors.code?.message && <div className="alert alert-error mt-1" id="rule-code-error">{errors.code.message}</div>}
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button type="button" variant="outline" colorScheme="secondary" onClick={onClose} disabled={loading} aria-label="Cancel">Cancel</Button>
            <Button type="submit" variant="solid" colorScheme="brand" isLoading={loading} aria-label={initialRule?.name ? 'Save' : 'Create'}>{initialRule?.name ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Card>
    </Dialog>
  );
};

// Best practices:
// - Modular, accessible, extensible dialog for rule create/edit.
// - Uses Headless UI, DaisyUI, Tailwind, Zod, React Hook Form, MonacoEditorWidget.
// - ARIA, keyboard nav, error feedback, optimistic updates.
// - Ready for integration in RuleListWidget and advanced rule management UI. 