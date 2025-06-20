import React from 'react';
// import { useNotificationSettings } from '@/hooks/useNotificationSettings';

export function NotificationSettingsWidget() {
  // TODO: Use useNotificationSettings() for data fetching and mutation
  // const { settings, updateSettings, isLoading, error } = useNotificationSettings();

  return (
    <section aria-labelledby="notification-settings-heading" className="flex flex-col gap-4">
      <h2 id="notification-settings-heading" className="text-xl font-semibold">Notification Settings</h2>
      {/* TODO: Replace with real form and toggles */}
      <form className="flex flex-col gap-4" aria-describedby="notification-settings-desc">
        <div id="notification-settings-desc" className="text-base-content/60">
          Manage your notification preferences for scheduled exports.
        </div>
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Email Notifications</span>
            <input type="checkbox" className="toggle toggle-primary" disabled />
          </label>
        </div>
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">In-App Notifications</span>
            <input type="checkbox" className="toggle toggle-secondary" disabled />
          </label>
        </div>
        {/* TODO: Add accessibility, keyboard navigation, and error handling */}
        <button type="submit" className="btn btn-primary w-full" disabled>
          Save Settings (Coming Soon)
        </button>
      </form>
    </section>
  );
} 