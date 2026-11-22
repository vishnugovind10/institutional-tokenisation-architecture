import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './workbench';
import { SaaSRoot } from './saas/SaaSRoot';
import './style.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><SaaSRoot><App /></SaaSRoot></React.StrictMode>);
