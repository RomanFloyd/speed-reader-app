import React, { useRef } from 'react'
import './PDFUploader.css'

// Загружаем PDF.js один раз
let pdfjsLib = null

const loadPDFJS = async () => {
  if (pdfjsLib) return pdfjsLib
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'
    script.onload = () => {
      pdfjsLib = window.pdfjsLib
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
      resolve(pdfjsLib)
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

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
      setProgress(20)
      console.log('Файл загружен в память')

      // Загружаем PDF.js
      const pdf = await loadPDFJS()
      setProgress(40)
      console.log('PDF.js загружена')

      // Парсим PDF
      const pdfDoc = await pdf.getDocument({ data: arrayBuffer }).promise
      setProgress(50)
      console.log('PDF распознан, страниц:', pdfDoc.numPages)

      let fullText = ''
      const totalPages = pdfDoc.numPages

      for (let i = 1; i <= totalPages; i++) {
        try {
          const page = await pdfDoc.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items
            .map(item => item.str)
            .join(' ')
          fullText += pageText + ' '
          
          const pageProgress = 50 + (i / totalPages) * 40
          setProgress(Math.round(pageProgress))
          
          if (i % 5 === 0) {
            console.log(`Обработано ${i}/${totalPages} страниц`)
          }
        } catch (pageErr) {
          console.warn(`Ошибка на странице ${i}:`, pageErr)
        }
      }

      setProgress(95)
      console.log('Все страницы обработаны')

      // Очищаем текст
      const words = fullText
        .split(/[\s\-.,!?;:«»„"()[\]{}]+/)
        .filter(word => word.length > 1)
        .filter(word => !/^\d+$/.test(word))
        .filter(word => word.match(/[а-яА-ЯёЁa-zA-Z]/))
        .slice(0, 10000)

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
