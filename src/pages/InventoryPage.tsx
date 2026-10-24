import React from 'react';

export const InventoryPage: React.FC = () => {
  return (
    <article className="border round">
      <div className="row items-center gap">
        <i className="extra primary-text">inventory_2</i>
        <div className="max">
          <h5 className="no-margin bold">Inventory</h5>
          <p className="no-margin secondary-text">Manage clothing items and stock</p>
        </div>
      </div>
      <div className="space"></div>
      <p>
        This is the Inventory page placeholder. Here you will be able to search,
        filter, add, and organize your apparel catalog.
      </p>
      <div className="space"></div>
      <div className="grid">
        <div className="s12 m4">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">Tops & Shirts</h6>
            <p className="secondary-text">Placeholder for tops list.</p>
          </div>
        </div>
        <div className="s12 m4">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">Pants & Bottoms</h6>
            <p className="secondary-text">Placeholder for bottoms list.</p>
          </div>
        </div>
        <div className="s12 m4">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">Accessories</h6>
            <p className="secondary-text">Placeholder for accessories list.</p>
          </div>
        </div>
      </div>
    </article>
  );
};
