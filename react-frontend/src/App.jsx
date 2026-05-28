import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './components/Sidebar.jsx'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import ProcessingScreen from './components/ProcessingScreen.jsx'
import Player from './pages/Player.jsx'
import Quiz from './pages/Quiz.jsx'
import QASheet from './pages/QASheet.jsx'
import useStore from './store/useStore.js'

const PAGE_COMPONENTS = {
  home:       <Home />,
  processing: <ProcessingScreen />,
  player:     <Player />,
  quiz:       <Quiz />,
  'qa-sheet': <QASheet />,
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

export default function App() {
  const currentPage = useStore((s) => s.currentPage)
  const appSidebarVisible = useStore((s) => s.appSidebarVisible)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#060816' }}>
      {/* Sidebar */}
      {appSidebarVisible && <Sidebar />}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto" style={{ background: '#060816' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              {PAGE_COMPONENTS[currentPage] ?? <Home />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
