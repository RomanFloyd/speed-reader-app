import React, { useState, useEffect } from 'react'
import './SpeedReader.css'

function SpeedReader({ words, fileName, onReset }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(250)
  const [progress, setProgress] = useState(0)

  const msPerWord = (60000 / wpm)

  useEffect(() => {
    let interval

    if (isPlaying && currentIndex < words.length) {
      interval = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev + 1 >= words.length) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, msPerWord)
    }

    return () => clearInterval(interval)
  }, [isPlaying, currentIndex, msPerWord, words.length])

  useEffect(() => {
    setProgress(Math.round((currentIndex / words.length) * 100))
  }, [currentIndex, words.length])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setIsPlaying(false)
    onReset()
  }

  const handleSkipBack = () => {
    setCurrentIndex(Math.max(0, currentIndex - 10))
  }

  const handleSkipForward = () => {
    setCurrentIndex(Math.min(words.length - 1, currentIndex + 10))
  }

  const handleProgressChange = (e) => {
    const newIndex = Math.floor((parseInt(e.target.value) / 100) * words.length)
    setCurrentIndex(newIndex)
  }

  const handleWpmChange = (e) => {
    setWpm(parseInt(e.target.value))
  }

  return (
    <div className="reader-container">
      <div className="reader-card">
        <div className="reader-header">
          <h2>📖 {fileName}</h2>
          <button className="close-button" onClick={handleReset}>✕</button>
        </div>

        <div className="word-display">
          <div className="current-word">
            {words[currentIndex] || 'Готово!'}
          </div>
          <div className="word-counter">
            {currentIndex + 1} / {words.length}
          </div>
        </div>

        <div className="progress-bar">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            className="progress-slider"
          />
          <div className="progress-text">{progress}%</div>
        </div>

        <div className="controls">
          <button className="control-button" onClick={handleSkipBack} title="Назад 10 слов">
            ⏮ -10
          </button>

          <button
            className={`control-button play-button ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayPause}
          >
            {isPlaying ? '⏸ Пауза' : '▶ Читать'}
          </button>

          <button className="control-button" onClick={handleSkipForward} title="Вперед 10 слов">
            +10 ⏭
          </button>
        </div>

        <div className="speed-control">
          <label>Скорость: {wpm} слов/мин</label>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={wpm}
            onChange={handleWpmChange}
            className="speed-slider"
          />
          <div className="speed-presets">
            <button onClick={() => setWpm(200)} className={wpm === 200 ? 'active' : ''}>200</button>
            <button onClick={() => setWpm(300)} className={wpm === 300 ? 'active' : ''}>300</button>
            <button onClick={() => setWpm(500)} className={wpm === 500 ? 'active' : ''}>500</button>
            <button onClick={() => setWpm(800)} className={wpm === 800 ? 'active' : ''}>800</button>
          </div>
        </div>

        <div className="reader-stats">
          <div className="stat">
            <span className="stat-label">Осталось:</span>
            <span className="stat-value">{words.length - currentIndex - 1}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Время:</span>
            <span className="stat-value">{Math.ceil((words.length - currentIndex) / wpm)} мин</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpeedReader
