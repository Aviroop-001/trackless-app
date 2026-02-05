import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './components/LandingPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import DemoPage from './pages/DemoPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/pricing" element={<PricingPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
