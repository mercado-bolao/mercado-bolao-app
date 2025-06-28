
// Tipos principais do sistema
export interface User {
  id: string
  nome: string
  email: string
  whatsapp?: string
  createdAt: Date
  updatedAt: Date
}

export interface Concurso {
  id: string
  numero: number
  nome: string
  dataInicio: Date
  dataFim: Date
  status: 'ativo' | 'encerrado' | 'suspenso'
  premioEstimado?: number
  fechamentoPalpites: Date
  jogos?: Jogo[]
  palpites?: Palpite[]
  createdAt: Date
  updatedAt: Date
}

export interface Jogo {
  id: string
  mandante: string
  visitante: string
  horario: Date
  resultadoFinal?: 'Vitória Mandante' | 'Empate' | 'Vitória Visitante'
  fotoMandante?: string
  fotoVisitante?: string
  concursoId: string
  concurso?: Concurso
  palpites?: Palpite[]
  createdAt: Date
  updatedAt: Date
}

export interface Palpite {
  id: string
  nome: string
  whatsapp: string
  resultado: 'Vitória Mandante' | 'Empate' | 'Vitória Visitante'
  pontos?: number
  jogoId: string
  jogo?: Jogo
  concursoId: string
  concurso?: Concurso
  userId?: string
  user?: User
  createdAt: Date
  updatedAt: Date
}

// Tipos para componentes
export interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined'
  hover?: boolean
}

export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export interface InputProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'tel' | 'url'
  size?: 'sm' | 'md' | 'lg'
  error?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Tipos para API responses
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Tipos para formulários
export interface ConcursoForm {
  nome: string
  dataInicio: string
  dataFim: string
  premioEstimado?: number
  fechamentoPalpites: string
}

export interface JogoForm {
  mandante: string
  visitante: string
  horario: string
  fotoMandante?: File
  fotoVisitante?: File
}

export interface PalpiteForm {
  nome: string
  whatsapp: string
  resultado: 'Vitória Mandante' | 'Empate' | 'Vitória Visitante'
}

// Tipos para rankings
export interface RankingEntry {
  posicao: number
  nome: string
  whatsapp: string
  pontos: number
  totalPalpites: number
  acertos: number
  percentualAcerto: number
}

// Tipos para estatísticas
export interface Estatisticas {
  totalConcursos: number
  totalJogos: number
  totalPalpites: number
  totalUsuarios: number
  concursoAtivo?: Concurso
  jogosHoje: number
  palpitesHoje: number
}

// Tipos para notificações
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Tipos para modal
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
}

// Tipos para tema
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  animations: boolean
}

// Tipos para configurações
export interface AppConfig {
  siteName: string
  siteDescription: string
  version: string
  theme: ThemeConfig
  features: {
    darkMode: boolean
    animations: boolean
    notifications: boolean
    realTime: boolean
  }
}
