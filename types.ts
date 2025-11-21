
export interface Article {
  id: string;
  title: string;
  category: string;
  source: string;
  imageUrl: string;
  content: string;
  data?: ChartData;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

export type ViewMode = 'grid' | 'reels';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  image?: string; // For displaying generated or uploaded images
  sources?: GroundingChunk[];
}

export interface TranscriptEntry {
  speaker: 'user' | 'cygnus';
  text: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface SearchResult {
  text: string;
  sources: GroundingChunk[];
}

export type LiveAgentStatus = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR' | 'CONNECTING';

export interface Filters {
    categories: Set<string>;
    sources: Set<string>;
}

export type AudioLanguage = 'english' | 'hindi' | 'hinglish';

// Add window type for aistudio and AudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}
