
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupVersionControlListeners } from './lib/utils/versionControlIntegration'

// Add dark mode class to html element by default
document.documentElement.classList.add('dark')

// Set up version control listeners for cache clearing
setupVersionControlListeners();

createRoot(document.getElementById("root")!).render(<App />);
