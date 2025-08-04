import './App.css'
import './styles/tokens.css'
import { VisuallyHidden } from './components/VisuallyHidden'
import { useUIStore } from './state/ui'
import { SwimmingView } from './views/SwimmingView'
import { DeeperDive } from './views/DeeperDive'
import { initializeAriaLiveRegion } from './utils/announce'
import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  const { ttsEnabled, toggleTTS } = useUIStore()
  
  // Initialize aria-live region for announcements
  useEffect(() => {
    initializeAriaLiveRegion();
  }, []);
  
  return (
    <Router>
      <VisuallyHidden>
        <div aria-live="polite" id="announcements"></div>
      </VisuallyHidden>
      
      <div className="app">
        <header className="app-header">
          <h1 className="logo">Sea Here</h1>
          <button 
            className={`tts-toggle ${ttsEnabled ? 'active' : ''}`}
            aria-label="Toggle text-to-speech"
            aria-pressed={ttsEnabled}
            type="button"
            onClick={toggleTTS}
          >
            {ttsEnabled ? '🔊' : '🔇'}
          </button>
        </header>
        
        <main role="main" className="app-main">
          <Routes>
            <Route path="/" element={<SwimmingView />} />
            <Route path="/species/:id" element={<SwimmingView />} />
            <Route path="/species/:id/deep" element={<DeeperDive />} />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <nav className="tab-bar" aria-label="Main navigation">
            <button className="tab-button active" aria-current="page">
              Home★
            </button>
            <button className="tab-button">
              List
            </button>
            <button className="tab-button">
              Search
            </button>
          </nav>
        </footer>
      </div>
    </Router>
  )
}

export default App
