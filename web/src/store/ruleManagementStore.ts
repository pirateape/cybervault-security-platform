// If you haven't already, install zustand: npm install zustand
// For middleware: npm install zustand-middleware
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type Theme = 'vs-dark' | 'light';

interface RuleManagementState {
  selectedRuleId: number | null;
  search: string;
  showModal: boolean;
  theme: Theme;
  deletingId: number | null;
  viewVersion: any | null;
  newRule: { name: string; content: string } | null;
  setSelectedRuleId: (id: number | null) => void;
  setSearch: (search: string) => void;
  setShowModal: (show: boolean) => void;
  setTheme: (theme: Theme) => void;
  setDeletingId: (id: number | null) => void;
  setViewVersion: (version: any | null) => void;
  setNewRule: (rule: { name: string; content: string } | null) => void;
}

/**
 * useRuleManagementStore provides global UI state for rule management, with persistence and devtools.
 */
export const useRuleManagementStore = create<RuleManagementState>()(
  devtools(
    persist(
      (set) => ({
        selectedRuleId: null,
        search: '',
        showModal: false,
        theme: 'vs-dark',
        deletingId: null,
        viewVersion: null,
        newRule: null,
        setSelectedRuleId: (id: number | null) =>
          set(() => ({ selectedRuleId: id })),
        setSearch: (search: string) => set(() => ({ search })),
        setShowModal: (show: boolean) => set(() => ({ showModal: show })),
        setTheme: (theme: Theme) => set(() => ({ theme })),
        setDeletingId: (id: number | null) => set(() => ({ deletingId: id })),
        setViewVersion: (version: any | null) =>
          set(() => ({ viewVersion: version })),
        setNewRule: (rule: { name: string; content: string } | null) =>
          set(() => ({ newRule: rule })),
      }),
      {
        name: 'rule-management-store',
        partialize: (state) => ({
          selectedRuleId: state.selectedRuleId,
          theme: state.theme,
          viewVersion: state.viewVersion,
        }),
      }
    )
  )
);

/**
 * Selector for theme preference.
 */
export const useTheme = () => useRuleManagementStore((s) => s.theme);

/**
 * Selector for selected rule id.
 */
export const useSelectedRuleId = () =>
  useRuleManagementStore((s) => s.selectedRuleId);
