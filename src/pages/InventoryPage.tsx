import React from 'react';
import { InventoryCard } from '../components/InventoryCard';
import { mockInventory } from '../data/mockInventory';

export const InventoryPage: React.FC = () => {
  return (
    <>
      <div className="row items-center gap">
        <i className="extra primary-text">inventory_2</i>
        <div className="max">
          <h5 className="no-margin bold">Inventory</h5>
          <p className="no-margin secondary-text">
            {mockInventory.length} outfits in the closet
          </p>
        </div>
      </div>

      <div className="space"></div>

      <div className="grid">
        {mockInventory.map((item) => (
          <div key={item.id} className="s12 m6 l4">
            <InventoryCard item={item} />
          </div>
        ))}
      </div>
    </>
  );
};
