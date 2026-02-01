import { GameProvider } from './hooks/useGame'
import { Game } from './components'
import './App.css'

function App() {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  )
}

export default App
