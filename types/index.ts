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
  nome: string | null
  numero: number
  status: string
  dataInicio: Date
  dataFim: Date
  premioEstimado: number | null
  fechamentoPalpites: Date | null
  jogos?: Jogo[]
  _count?: {
    palpites: number
    jogos: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface Jogo {
  id: string
  mandante: string
  visitante: string
  data: Date
  resultado: string | null
  concursoId: string
  concurso?: Concurso
  createdAt: Date
  updatedAt: Date
}

export interface Palpite {
  id: string
  nome: string
  whatsapp: string
  resultado: string
  valor: number
  status: string
  jogoId: string
  concursoId: string
  createdAt: Date
  userId: string | null
  pixId: string | null
  bilheteId: string | null
  jogo?: Jogo
  concurso?: Concurso
  updatedAt: Date
}

export interface Bilhete {
  id: string
  nome: string
  whatsapp: string
  status: string
  concursoId: string
  createdAt: Date
  valorTotal: number
  quantidadePalpites: number
  txid: string | null
  orderId: string | null
  expiresAt: Date
  updatedAt: Date
  ipAddress: string | null
  userAgent: string | null
  palpites?: Palpite[]
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
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: string | null | Record<string, any>
  message?: string
}

export interface ErrorWithMessage {
  message: string
  name?: string
}

export interface TestResult {
  status: 'OK' | 'ERROR' | 'WARNING' | 'unknown'
  details: null | string | Record<string, any>
}

export interface SystemTestResults {
  database: TestResult
  txidGeneration: TestResult
  efiCredentials: TestResult
  concursos: TestResult
  jogos: TestResult
  palpites?: TestResult
  pixGeneration?: TestResult
  webhookConfig?: TestResult
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

export interface WebhookLog {
  id: string;
  evento: string;
  txid: string | null;
  dados: any;
  processado: boolean;
  createdAt: Date;
}
