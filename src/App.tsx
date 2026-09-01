import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Footer } from './components/layout/Footer'
import { Header } from './components/layout/Header'
import { RiskDisclosure } from './components/layout/RiskDisclosure'
import { AcademyPage } from './pages/AcademyPage'
import { ArenaPage } from './pages/ArenaPage'
import { LandingPage } from './pages/LandingPage'
import { PerformancePage } from './pages/PerformancePage'
import { RecordsPage } from './pages/RecordsPage'
import { SimulationLabPage } from './pages/SimulationLabPage'

/**
 * HashRouter is used deliberately: the app is a static build with no
 * server rewrites, so hash routes work identically wherever it is
 * hosted, including from a plain file server.
 */
export default function App() {
  return (
    <HashRouter>
      <div className="flex min-h-screen flex-col bg-panel-0">
        <Header />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/academy" element={<AcademyPage />} />
            <Route path="/arena" element={<ArenaPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/simulation" element={<SimulationLabPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
            <RiskDisclosure />
          </div>
        </main>

        <Footer />
      </div>
    </HashRouter>
  )
}
