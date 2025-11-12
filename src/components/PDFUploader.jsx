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

      // Загружаем PDF.js библиотеку
      const pdfScript = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.0/pdf.min.js')
      const pdfCode = await pdfScript.text()
      
      // Выполняем код в контексте окна
      eval(pdfCode)
      
      setProgress(50)
      console.log('PDF.js загружена')

      // Используем встроенный парсер
      const uint8Array = new Uint8Array(arrayBuffer)
      const pdf = await window.pdfjsLib.getDocument({ data: uint8Array }).promise
      setProgress(60)
      console.log('PDF распознан, страниц:', pdf.numPages)

      let fullText = ''
      const totalPages = pdf.numPages

      for (let i = 1; i <= totalPages; i++) {
        try {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map(item => item.str).join(' ')
          fullText += pageText + ' '
          
          const pageProgress = 60 + (i / totalPages) * 30
          setProgress(Math.round(pageProgress))
          
          if (i % 10 === 0) {
            console.log(`Обработано ${i}/${totalPages} страниц`)
          }
        } catch (pageErr) {
          console.warn(`Ошибка на странице ${i}:`, pageErr)
        }
      }

      console.log('Все страницы обработаны, начинаю очистку текста')
      setProgress(95)

      // Split into words and clean
      const words = fullText
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(word => word.replace(/[^\w\s\-]/g, ''))
        .filter(word => word.length > 0)

      console.log('Готово! Всего слов:', words.length)
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
