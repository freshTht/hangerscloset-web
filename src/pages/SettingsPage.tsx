import React from 'react';

export const SettingsPage: React.FC = () => {
  return (
    <article className="border round">
      <div className="row items-center gap">
        <i className="extra primary-text">settings</i>
        <div className="max">
          <h5 className="no-margin bold">Settings</h5>
          <p className="no-margin secondary-text">App configuration and preferences</p>
        </div>
      </div>
      <div className="space"></div>
      <p>
        This is the Settings page placeholder. Manage your profile, account preferences,
        notifications, and application configurations here.
      </p>
      <div className="space"></div>
      <div className="grid">
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">Profile Settings</h6>
            <p className="secondary-text">User account and details configuration.</p>
          </div>
        </div>
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">App Preferences</h6>
            <p className="secondary-text">Theme, notifications, and export options.</p>
          </div>
        </div>
      </div>
    </article>
  );
};
