import React, { useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import './PDFUploader.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

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

      const arrayBuffer = await file.arrayBuffer()
      setProgress(20)

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      setProgress(40)

      let fullText = ''
      const totalPages = pdf.numPages

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ')
        fullText += pageText + ' '
        
        // Обновляем прогресс по мере обработки страниц
        const pageProgress = 40 + (i / totalPages) * 50
        setProgress(Math.round(pageProgress))
      }

      setProgress(95)

      // Split into words and clean
      const words = fullText
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(word => word.replace(/[^\w\s\-]/g, ''))
        .filter(word => word.length > 0)

      setProgress(100)
      onPDFLoaded(words, file.name)
      setLoading(false)
    } catch (err) {
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
