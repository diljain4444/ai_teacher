import axios from 'axios'

// In dev, Vite proxy rewrites /api → localhost:8000.
// In production (APK), VITE_API_BASE_URL is set to the hosted backend URL.
const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api'

const api = axios.create({ baseURL })

// Upload a file, returns { file_id, filename, pages, size }
export const uploadFile = async (file) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// Start processing, returns { job_id }
export const startProcessing = async ({ file_id, pages, language, task }) => {
  const { data } = await api.post('/process', { file_id, pages, language, task })
  return data
}

// Poll job status
export const getJobStatus = async (job_id) => {
  const { data } = await api.get(`/jobs/${job_id}/status`)
  return data
}

// Get final result
export const getJobResult = async (job_id) => {
  const { data } = await api.get(`/jobs/${job_id}/result`)
  return data
}

// Generate quiz
export const generateQuiz = async ({ file_id, pages, task }) => {
  const { data } = await api.post('/quiz', { file_id, pages, task })
  return data
}

// Generate Q&A bank
export const generateQABank = async ({ file_id, pages, task }) => {
  const { data } = await api.post('/qa-bank', { file_id, pages, task })
  return data
}

// Ask a question
export const askQuestion = async ({ explanation_text, question, language }) => {
  const { data } = await api.post('/ask', { explanation_text, question, language })
  return data
}

// Download Q&A DOCX
export const downloadQADocx = async (qa_bank, title) => {
  const response = await api.post('/download/qa', { qa_bank, title }, { responseType: 'blob' })
  const url = window.URL.createObjectURL(response.data)
  const a = document.createElement('a')
  a.href = url
  a.download = 'practice_questions.docx'
  a.click()
  window.URL.revokeObjectURL(url)
}

// Download Quiz DOCX
export const downloadQuizDocx = async (quiz_data, title) => {
  const response = await api.post('/download/quiz', { quiz_data, title }, { responseType: 'blob' })
  const url = window.URL.createObjectURL(response.data)
  const a = document.createElement('a')
  a.href = url
  a.download = 'quiz.docx'
  a.click()
  window.URL.revokeObjectURL(url)
}

// Build a blob URL from base64 audio
export const audioBlobUrl = (b64) => {
  if (!b64) return null
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'audio/mp3' })
  return URL.createObjectURL(blob)
}

export default api
