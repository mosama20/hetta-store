import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes.js';
import { HeadManager } from './components/common/HeadManager.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <HeadManager />
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;

