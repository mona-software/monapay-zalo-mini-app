import React from 'react';
import { createRoot } from 'react-dom/client';
import 'zmp-ui/zaui.css';
import './assets/app.css';
import MonaPayApp from './app';

const root = document.getElementById('app');
if (!root) throw new Error('Không tìm thấy #app để mount Zalo Mini App.');
createRoot(root).render(
  <React.StrictMode>
    <MonaPayApp />
  </React.StrictMode>,
);
