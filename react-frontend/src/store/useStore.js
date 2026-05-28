import { create } from 'zustand'

const useStore = create((set, get) => ({
  // ── Navigation ──────────────────────────────────────────────
  currentPage: 'home',  // 'home' | 'processing' | 'player' | 'quiz' | 'qa-sheet' | 'qa'
  setPage: (page) => set({ currentPage: page }),
  appSidebarVisible: true,
  setAppSidebarVisible: (visible) => set({ appSidebarVisible: visible }),

  // ── File Info ────────────────────────────────────────────────
  fileInfo: null,   // { file_id, filename, pages, size }
  setFileInfo: (info) => set({ fileInfo: info }),

  // ── Settings ─────────────────────────────────────────────────
  language: 'hinglish',
  task: 'theory',
  pageMode: 'all',       // 'all' | 'range'
  startPage: 1,
  endPage: 3,
  setLanguage: (language) => set({ language }),
  setTask: (task) => set({ task }),
  setPageMode: (pageMode) => set({ pageMode }),
  setStartPage: (startPage) => set({ startPage }),
  setEndPage: (endPage) => set({ endPage }),

  // ── Processing Job ───────────────────────────────────────────
  jobId: null,
  jobStatus: null,   // 'queued' | 'processing' | 'done' | 'error'
  jobProgress: 0,
  jobMessage: '',
  jobError: null,
  setJobId: (jobId) => set({ jobId }),
  setJobStatus: (jobStatus) => set({ jobStatus }),
  setJobProgress: (jobProgress) => set({ jobProgress }),
  setJobMessage: (jobMessage) => set({ jobMessage }),
  setJobError: (jobError) => set({ jobError }),

  // ── Slides (Player) ──────────────────────────────────────────
  slides: [],       // processed slide objects
  currentSlide: 0,
  setSlides: (slides) => set({ slides, currentSlide: 0 }),
  setCurrentSlide: (i) => set({ currentSlide: i }),
  nextSlide: () => {
    const { currentSlide, slides } = get()
    if (currentSlide < slides.length - 1) set({ currentSlide: currentSlide + 1 })
  },
  prevSlide: () => {
    const { currentSlide } = get()
    if (currentSlide > 0) set({ currentSlide: currentSlide - 1 })
  },

  // ── Quiz ─────────────────────────────────────────────────────
  quizData: [],
  quizAnswers: {},      // { questionIndex: selectedOption }
  quizSubmitted: false,
  quizScore: 0,
  setQuizData: (quizData) => set({ quizData, quizAnswers: {}, quizSubmitted: false, quizScore: 0 }),
  setQuizAnswer: (idx, option) => set((s) => ({ quizAnswers: { ...s.quizAnswers, [idx]: option } })),
  submitQuiz: () => {
    const { quizData, quizAnswers } = get()
    let score = 0
    quizData.forEach((q, i) => {
      if (quizAnswers[i] && quizAnswers[i].trim().toLowerCase() === q.answer.trim().toLowerCase())
        score++
    })
    set({ quizSubmitted: true, quizScore: score })
  },
  resetQuiz: () => set({ quizAnswers: {}, quizSubmitted: false, quizScore: 0 }),

  // ── Q&A Bank ─────────────────────────────────────────────────
  qaBank: [],
  setQABank: (qaBank) => set({ qaBank }),

  // ── Ask Q&A ──────────────────────────────────────────────────
  chatHistory: [],    // [{ role: 'user'|'ai', text, audio_b64? }]
  addChatMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
  clearChat: () => set({ chatHistory: [] }),

  // ── Reset all ────────────────────────────────────────────────
  reset: () => set({
    currentPage: 'home', fileInfo: null, jobId: null, jobStatus: null,
    appSidebarVisible: true,
    jobProgress: 0, jobMessage: '', jobError: null, slides: [], currentSlide: 0,
    quizData: [], quizAnswers: {}, quizSubmitted: false, quizScore: 0,
    qaBank: [], chatHistory: [],
  }),
}))

export default useStore
