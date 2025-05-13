
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'

// Add dark mode class to html element by default
document.documentElement.classList.add('dark')

createRoot(document.getElementById("root")!).render(<App />);
