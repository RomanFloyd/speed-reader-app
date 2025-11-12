import React, { useRef } from 'react'
import './PDFUploader.css'

function PDFUploader({ onPDFLoaded }) {
  const fileInputRef = useRef(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [progress, setProgress] = React.useState(0)

  const extractTextFromPDF = async (file) => {
    try {
      setLoading(true)
      setError('')
      setProgress(0)

      // Проверка размера файла
      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > 50) {
        setError(`Файл слишком большой (${fileSizeMB.toFixed(1)} МБ). Максимум 50 МБ.`)
        setLoading(false)
        return
      }

      console.log('Начинаю загрузку файла:', file.name, `(${fileSizeMB.toFixed(1)} МБ)`)

      const arrayBuffer = await file.arrayBuffer()
      setProgress(30)
      console.log('Файл загружен в память')

      // Простой парсер PDF текста
      const uint8Array = new Uint8Array(arrayBuffer)
      let text = ''
      
      // Ищем текстовые потоки в PDF
      for (let i = 0; i < uint8Array.length; i++) {
        const byte = uint8Array[i]
        // Ищем ASCII текст между BT (Begin Text) и ET (End Text)
        if (byte >= 32 && byte <= 126) {
          text += String.fromCharCode(byte)
        } else if (byte === 10 || byte === 13) {
          text += ' '
        }
      }

      setProgress(60)
      console.log('Текст извлечен из PDF')

      // Очищаем текст от мусора
      text = text
        .replace(/stream\s+/g, ' ')
        .replace(/endstream\s+/g, ' ')
        .replace(/obj\s+/g, ' ')
        .replace(/endobj\s+/g, ' ')
        .replace(/\d+\s+\d+\s+R/g, ' ')
        .replace(/\/\w+\s+/g, ' ')
        .replace(/\(\)/g, ' ')
        .replace(/[^\w\s\-\u0400-\u04FF]/g, ' ')

      setProgress(80)

      // Split into words and clean
      const words = text
        .split(/\s+/)
        .filter(word => word.length > 0)
        .filter(word => !/^\d+$/.test(word)) // Убираем чистые цифры
        .slice(0, 10000) // Максимум 10000 слов для производительности

      console.log('Готово! Всего слов:', words.length)
      
      if (words.length === 0) {
        setError('Не удалось извлечь текст из PDF. Попробуй другой файл.')
        setLoading(false)
        setProgress(0)
        return
      }

      setProgress(100)
      onPDFLoaded(words, file.name)
      setLoading(false)
    } catch (err) {
      console.error('Ошибка при загрузке PDF:', err)
      setError('Ошибка при загрузке PDF: ' + err.message)
      setLoading(false)
      setProgress(0)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      extractTextFromPDF(file)
    } else {
      setError('Пожалуйста, выбери PDF файл')
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="uploader-container">
      <div className="uploader-card">
        <div className="uploader-icon">📄</div>
        <h2>Загрузи PDF файл</h2>
        <p>Выбери PDF документ для скоростного чтения</p>

        <button
          className="upload-button"
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? `Загружаю... ${progress}%` : '+ Выбрать файл'}
        </button>

        {loading && (
          <div className="progress-container">
            <div className="progress-bar-upload">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="progress-text">{progress}% готово</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {error && <div className="error-message">{error}</div>}

        <div className="uploader-hint">
          <p>💡 Совет: Начни с 200-300 слов в минуту и постепенно увеличивай скорость</p>
        </div>
      </div>
    </div>
  )
}

export default PDFUploader
