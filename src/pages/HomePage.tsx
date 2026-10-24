import React from 'react';

export const HomePage: React.FC = () => {
  return (
    <article className="border round">
      <div className="row items-center gap">
        <i className="extra primary-text">home</i>
        <div className="max">
          <h5 className="no-margin bold">Home</h5>
          <p className="no-margin secondary-text">Welcome to Hanger's Closet</p>
        </div>
      </div>
      <div className="space"></div>
      <p>
        This is the Home page placeholder. You can start building your dashboard,
        recent activity feed, or closet highlights here.
      </p>
      <div className="space"></div>
      <div className="grid">
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">Quick Overview</h6>
            <p className="secondary-text">Summary of items and closet status.</p>
          </div>
        </div>
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">Recent Additions</h6>
            <p className="secondary-text">Placeholder for recently cataloged outfits.</p>
          </div>
        </div>
      </div>
      <div className="grid">
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">Quick Overview</h6>
            <p className="secondary-text">Summary of items and closet status.</p>
          </div>
        </div>
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">Recent Additions</h6>
            <p className="secondary-text">Placeholder for recently cataloged outfits.</p>
          </div>
        </div>
      </div>
      <div className="grid">
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">Quick Overview</h6>
            <p className="secondary-text">Summary of items and closet status.</p>
          </div>
        </div>
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">Recent Additions</h6>
            <p className="secondary-text">Placeholder for recently cataloged outfits.</p>
          </div>
        </div>
      </div>
    </article>
  );
};
