import React, { useState } from 'react'
import PDFUploader from './components/PDFUploader'
import SpeedReader from './components/SpeedReader'
import './App.css'

function App() {
  const [words, setWords] = useState([])
  const [fileName, setFileName] = useState('')

  const handlePDFLoaded = (extractedWords, name) => {
    setWords(extractedWords)
    setFileName(name)
  }

  const handleReset = () => {
    setWords([])
    setFileName('')
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📖 Speed Reader</h1>
        <p>Загрузи PDF и читай быстрее!</p>
      </header>

      <main className="app-main">
        {words.length === 0 ? (
          <PDFUploader onPDFLoaded={handlePDFLoaded} />
        ) : (
          <SpeedReader words={words} fileName={fileName} onReset={handleReset} />
        )}
      </main>
    </div>
  )
}

export default App
