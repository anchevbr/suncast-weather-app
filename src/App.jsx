import Home from './Home.jsx'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  )
}

export default App
