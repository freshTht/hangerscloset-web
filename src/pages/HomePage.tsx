import React from 'react';
import { Stack } from '../components/Stack';

export const HomePage: React.FC = () => {
  return (
    <Stack
      orientation="column"
      align="center"
      justify="center"
      gap="tiny"
      className="padding"
      style={{ minHeight: '60vh', textAlign: 'center' }}
    >
      <h5 className="bold no-margin">Coming soon</h5>
      <p className="secondary-text no-margin">เร็วๆ นี้</p>
    </Stack>
  );
};
