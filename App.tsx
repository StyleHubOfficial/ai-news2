import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from 'react';
import { LiveServerMessage } from '@google/genai';
import { Article, ViewMode, SearchResult, ChatMessage, Filters, TranscriptEntry, LiveAgentStatus, AudioLanguage, GroundingChunk } from './types';
import { MOCK_ARTICLES, CATEGORIES, SOURCES, AUDIO_GENERATION_MESSAGES, LIVE_AGENT_STATUS } from './constants';
import * as gemini from './services/geminiService';
import { decode, encode, decodeAudioData, createBlob } from './utils/audioUtils';

// --- ICONS ---
// A library of SVG icons used throughout the application.
const Icon = ({ children, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);
const LogoIcon = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="#00aaff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 7L12 12L22 7" stroke="#00aaff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 22V12" stroke="#00aaff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M20 15.5L12 19.5L4 15.5" stroke="#9c27b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></Icon>);
const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.12l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0-2.12l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></Icon>);
const GridIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></Icon>);
const ReelsIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line></Icon>);
const BookmarkIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></Icon>);
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></Icon>);
const ListIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></Icon>);
const BrainIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><path d="M12 2a4.5 4.5 0 0 0-4.5 4.5c0 1.04.36 2.04.99 2.84V12h7.02c.63-.8 1-1.8 1-2.84A4.5 4.5 0 0 0 12 2z"/><path d="M4.5 12a2.5 2.5 0 0 0-2.5 2.5V17a2.5 2.5 0 0 0 2.5 2.5h0a2.5 2.5 0 0 0 2.5-2.5v-2.05"/><path d="M19.5 12a2.5 2.5 0 0 1 2.5 2.5V17a2.5 2.5 0 0 1-2.5 2.5h0a2.5 2.5 0 0 1-2.5-2.5v-2.05"/><path d="M12 12v2.5a2.5 2.5 0 0 0 2.5 2.5h0a2.5 2.5 0 0 0 2.5-2.5V12"/><path d="M12 12v2.5a2.5 2.5 0 0 1-2.5 2.5h0A2.5 2.5 0 0 1 7 14.5V12"/><path d="M12 12h.01"/></Icon>);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><path d="M12 3L9.5 8.5 4 11l5.5 2.5L12 19l2.5-5.5L20 11l-5.5-2.5z"/></Icon>);
const ChartIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></Icon>);
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></Icon>);
const SoundWaveIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><path d="M2 10v4"/><path d="M6 7v10"/><path d="M10 4v16"/><path d="M14 7v10"/><path d="M18 10v4"/></Icon>);
const MicIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></Icon>);
const BoltIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></Icon>);
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><polygon points="5 3 19 12 5 21 5 3"></polygon></Icon>);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></Icon>);
const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></Icon>);
const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></Icon>);
const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></Icon>);
const LoaderIcon = (props: React.SVGProps<SVGSVGElement>) => (<Icon {...props} className={`animate-spin ${props.className}`}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></Icon>);

// --- Main App Component ---
export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observer = useRef<IntersectionObserver>();

  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem('savedGNewsArticleIds') || '[]')));
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSaved, setShowSaved] = useState(false);
  const [filters, setFilters] = useState<Filters>({ categories: new Set(), sources: new Set() });

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  // Modals visibility state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isLiveAgentModalOpen, setIsLiveAgentModalOpen] = useState(false);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);

  useEffect(() => {
    // Initial article load
    const newArticles = MOCK_ARTICLES.slice(0, 5); // Load 5 initially
    setArticles(newArticles);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('savedGNewsArticleIds', JSON.stringify(Array.from(savedArticleIds)));
  }, [savedArticleIds]);

  const fetchMoreArticles = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    // Simulating API call
    setTimeout(() => {
      const newPage = page + 1;
      const newArticles = MOCK_ARTICLES.slice(articles.length, articles.length + 5);
      if (newArticles.length === 0) {
        setHasMore(false);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
        setPage(newPage);
      }
      setIsLoading(false);
    }, 1000);
  }, [page, articles.length, isLoading, hasMore]);
  
  const lastArticleElementRef = useCallback(node => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting && hasMore) {
              fetchMoreArticles();
          }
      });
      if (node) observer.current.observe(node);
  }, [isLoading, hasMore, fetchMoreArticles]);

  const toggleSaveArticle = (articleId: string) => {
    setSavedArticleIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) newSet.delete(articleId);
      else newSet.add(articleId);
      return newSet;
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults(null);
    try {
      const results = await gemini.searchWithGoogle(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults({ text: "An error occurred during the search.", sources: [] });
    } finally {
      setIsSearching(false);
    }
  };
  
  const filteredArticles = useMemo(() => {
      let articlesToFilter = showSaved ? MOCK_ARTICLES.filter(a => savedArticleIds.has(a.id)) : articles;
      if(filters.categories.size > 0) {
          articlesToFilter = articlesToFilter.filter(a => filters.categories.has(a.category));
      }
      if(filters.sources.size > 0) {
          articlesToFilter = articlesToFilter.filter(a => filters.sources.has(a.source));
      }
      return articlesToFilter;
  }, [articles, showSaved, savedArticleIds, filters]);

  // Close modals with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedArticle(null);
        setIsSettingsModalOpen(false);
        setIsAudioModalOpen(false);
        setIsLiveAgentModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
        <header className="sticky top-0 z-40 bg-brand-bg/80 backdrop-blur-lg border-b border-brand-surface/50">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-shrink-0">
                    <LogoIcon />
                    <h1 className="text-xl md:text-2xl font-orbitron font-bold text-brand-primary tracking-widest hidden sm:block">G-NEWS</h1>
                </div>
                <div className="flex-1 min-w-0 max-w-xl">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Ask about current events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-brand-surface border border-brand-primary/30 rounded-full py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-300"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                        {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-t-brand-primary border-r-brand-primary border-b-transparent border-l-transparent rounded-full animate-spin"></div>}
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 rounded-full hover:bg-brand-surface transition-colors" aria-label="Settings"><SettingsIcon /></button>
                    <button onClick={() => setViewMode(viewMode === 'grid' ? 'reels' : 'grid')} className="p-2 rounded-full hover:bg-brand-surface transition-colors" aria-label="Toggle View">{viewMode === 'grid' ? <ReelsIcon /> : <GridIcon />}</button>
                    <button onClick={() => setShowSaved(!showSaved)} className={`p-2 rounded-full hover:bg-brand-surface transition-colors ${showSaved ? 'text-brand-accent' : ''}`} aria-label="Show Saved Articles">
                        <BookmarkIcon style={{ fill: showSaved ? 'currentColor' : 'none' }}/>
                    </button>
                </div>
            </div>
        </header>
      
        <main className="container mx-auto p-4">
            {searchResults && (
                <div className="mb-8 p-6 bg-brand-surface rounded-lg border border-brand-secondary/30 animate-fadeIn">
                    <h2 className="font-orbitron text-xl text-brand-primary mb-2">Search Result:</h2>
                    <p className="whitespace-pre-wrap mb-4">{searchResults.text}</p>
                    {searchResults.sources && searchResults.sources.length > 0 && (
                        <div>
                            <h3 className="text-md font-bold text-brand-text-muted mb-2">Sources:</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {searchResults.sources.map((source, index) => source.web && (
                                    <li key={index}>
                                        <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline hover:text-brand-accent">
                                            {source.web.title || source.web.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                     <button onClick={() => setSearchResults(null)} className="mt-4 text-sm text-brand-text-muted hover:text-brand-accent">Clear Search</button>
                </div>
            )}
            
            {viewMode === 'grid' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {filteredArticles.map((article, index) => (
                         <div key={article.id} ref={index === filteredArticles.length - 1 ? lastArticleElementRef : null}>
                            <NewsCard article={article} onSelect={() => setSelectedArticle(article)} onToggleSave={toggleSaveArticle} isSaved={savedArticleIds.has(article.id)} />
                         </div>
                     ))}
                 </div>
            ) : (
                <p>Reels view coming soon!</p>
            )}

            {isLoading && (
                <div className="flex justify-center items-center my-8">
                    <LoaderIcon className="w-8 h-8 text-brand-primary" />
                </div>
            )}

        </main>
        
        {/* Modals and floating buttons */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
            <button onClick={() => setIsChatBotOpen(!isChatBotOpen)} className="w-16 h-16 bg-brand-secondary rounded-full shadow-lg flex items-center justify-center text-white hover:bg-purple-700 transition-transform hover:scale-110 animate-glow" aria-label="AI Assistant"><BoltIcon className="w-8 h-8"/></button>
            <button onClick={() => setIsLiveAgentModalOpen(true)} className="w-16 h-16 bg-brand-primary rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-400 transition-transform hover:scale-110 animate-pulsate" aria-label="Live Agent"><MicIcon className="w-8 h-8"/></button>
            <button onClick={() => setIsAudioModalOpen(true)} className="w-16 h-16 bg-brand-accent rounded-full shadow-lg flex items-center justify-center text-white hover:bg-pink-600 transition-transform hover:scale-110" aria-label="Audio Synthesis"><SoundWaveIcon className="w-8 h-8"/></button>
        </div>
        
        {isChatBotOpen && <ChatBot onClose={() => setIsChatBotOpen(false)} />}
        
        {selectedArticle && (
            <ArticleModal 
                article={selectedArticle} 
                onClose={() => setSelectedArticle(null)}
                isSaved={savedArticleIds.has(selectedArticle.id)}
                onToggleSave={toggleSaveArticle}
            />
        )}

        {isSettingsModalOpen && (
            <SettingsModal 
                onClose={() => setIsSettingsModalOpen(false)}
                filters={filters}
                onFiltersChange={setFilters}
            />
        )}
        
        {isAudioModalOpen && <AudioGenerationModal onClose={() => setIsAudioModalOpen(false)} articles={MOCK_ARTICLES} />}

        {isLiveAgentModalOpen && <LiveAgentModal onClose={() => setIsLiveAgentModalOpen(false)} />}
    </div>
  );
}

// --- SUB-COMPONENTS ---
// Note: In a larger application, these would be in their own files.

function NewsCard({ article, onSelect, onToggleSave, isSaved }: { article: Article, onSelect: () => void, onToggleSave: (id: string) => void, isSaved: boolean }) {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        gemini.getShortSummary(article.content)
            .then(setSummary)
            .catch(err => {
                console.error(err);
                setSummary("Could not generate summary.");
            })
            .finally(() => setIsLoading(false));
    }, [article.content]);

    return (
        <div className="bg-brand-surface rounded-lg overflow-hidden shadow-lg h-full flex flex-col border border-brand-primary/10 hover:border-brand-primary/50 transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn">
            <div className="relative">
                <img src={article.imageUrl} alt={article.title} className="w-full h-48 object-cover" />
                <div className="absolute top-2 left-2 bg-brand-secondary/80 text-white text-xs font-bold px-2 py-1 rounded">{article.category}</div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-orbitron text-lg font-bold mb-2 cursor-pointer hover:text-brand-primary" onClick={onSelect}>{article.title}</h3>
                <div className="text-brand-text-muted text-sm flex-grow">
                    {isLoading ? (
                        <div className="space-y-2">
                            <div className="h-4 bg-brand-bg rounded w-full animate-pulse"></div>
                            <div className="h-4 bg-brand-bg rounded w-5/6 animate-pulse"></div>
                            <div className="h-4 bg-brand-bg rounded w-3/4 animate-pulse"></div>
                        </div>
                    ) : summary}
                </div>
                <div className="mt-4 pt-4 border-t border-brand-primary/10 flex justify-between items-center">
                    <span className="text-xs text-brand-text-muted">{article.source}</span>
                    <button onClick={() => onToggleSave(article.id)} className={`p-2 rounded-full hover:bg-brand-bg ${isSaved ? 'text-brand-accent' : 'text-brand-text-muted'}`} aria-label="Save Article">
                        <BookmarkIcon style={{ fill: isSaved ? 'currentColor' : 'none' }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// FIX: Made the 'children' prop optional to resolve incorrect TypeScript errors.
function Modal({ children, onClose, title }: { children?: React.ReactNode, onClose: () => void, title: string }) {
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-fadeIn" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-brand-primary/30 animate-slideUp" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex justify-between items-center border-b border-brand-primary/20">
                    <h2 className="text-xl font-orbitron text-brand-primary">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-bg" aria-label="Close modal"><XIcon /></button>
                </header>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

function ArticleModal({ article, onClose, isSaved, onToggleSave }: { article: Article, onClose: () => void, isSaved: boolean, onToggleSave: (id: string) => void }) {
    type Tab = 'full' | 'summary' | 'analysis' | 'edit';
    const [activeTab, setActiveTab] = useState<Tab>('full');
    const [tabContent, setTabContent] = useState<Record<Tab, string | null>>({ full: article.content, summary: null, analysis: null, edit: null });
    const [isLoading, setIsLoading] = useState(false);
    const [editPrompt, setEditPrompt] = useState('Add a retro filter');
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleTabClick = async (tab: Tab) => {
        setActiveTab(tab);
        if (tabContent[tab] || tab === 'full' || tab === 'edit') return;

        setIsLoading(true);
        try {
            let content;
            if (tab === 'summary') content = await gemini.getFastSummary(article.content);
            if (tab === 'analysis') content = await gemini.getDeepAnalysis(article.content);
            setTabContent(prev => ({ ...prev, [tab]: content }));
        } catch (error) {
            console.error(`Failed to load ${tab}`, error);
            setTabContent(prev => ({ ...prev, [tab]: `Error loading content.` }));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEditImage = async () => {
        setIsEditing(true);
        try {
            const response = await fetch(article.imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = (reader.result as string).split(',')[1];
                const newImageBase64 = await gemini.editImage(editPrompt, base64data, blob.type);
                setEditedImage(`data:image/png;base64,${newImageBase64}`);
            };
        } catch(error) {
            console.error("Image editing failed:", error);
        } finally {
            setIsEditing(false);
        }
    }

    const renderTabContent = () => {
        if (isLoading) return <div className="flex justify-center items-center h-48"><LoaderIcon className="w-8 h-8 text-brand-primary"/></div>
        if (activeTab === 'edit') {
            return (
                <div>
                     <div className="flex gap-2 mb-4">
                        <input type="text" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} className="flex-grow bg-brand-bg border border-brand-primary/30 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="e.g., Make it black and white"/>
                        <button onClick={handleEditImage} disabled={isEditing} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-400 disabled:bg-gray-500 flex items-center">
                            {isEditing ? <LoaderIcon className="w-5 h-5 mr-2"/> : <SparklesIcon className="w-5 h-5 mr-2" />}
                            Generate
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-bold mb-2">Original</h4>
                            <img src={article.imageUrl} alt="Original" className="rounded-lg w-full"/>
                        </div>
                        <div>
                            <h4 className="font-bold mb-2">Edited</h4>
                             {isEditing ? <div className="w-full aspect-video bg-brand-bg rounded-lg flex items-center justify-center animate-pulse">Editing...</div> : editedImage ? <img src={editedImage} alt="Edited" className="rounded-lg w-full"/> : <div className="w-full aspect-video bg-brand-bg rounded-lg flex items-center justify-center text-brand-text-muted">Edit will appear here</div>}
                        </div>
                    </div>
                </div>
            )
        }
        return <div className="prose prose-invert max-w-none prose-p:text-brand-text prose-headings:text-brand-primary prose-strong:text-brand-text prose-a:text-brand-accent whitespace-pre-wrap">{tabContent[activeTab]}</div>;
    }

    const tabs: { id: Tab, label: string, icon: React.ReactNode }[] = [
        { id: 'full', label: 'Full Text', icon: <ListIcon/> },
        { id: 'summary', label: 'Summary', icon: <ListIcon/> },
        { id: 'analysis', label: 'Analysis', icon: <BrainIcon/> },
        { id: 'edit', label: 'Edit Image', icon: <EditIcon/> }
    ];

    return (
        <Modal onClose={onClose} title={article.title}>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                    <img src={article.imageUrl} alt={article.title} className="rounded-lg mb-4"/>
                    <div className="flex justify-around">
                        <button onClick={() => onToggleSave(article.id)} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${isSaved ? 'bg-brand-accent text-white' : 'bg-brand-bg hover:bg-brand-primary/20'}`}><BookmarkIcon style={{fill: isSaved ? 'currentColor' : 'none'}}/> Save</button>
                    </div>
                </div>
                <div className="md:w-2/3">
                    <div className="border-b border-brand-primary/20 mb-4">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => handleTabClick(tab.id)}
                                    className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-text-muted hover:text-brand-text hover:border-gray-500'}`}>
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div>{renderTabContent()}</div>
                </div>
            </div>
        </Modal>
    );
}

function SettingsModal({ onClose, filters, onFiltersChange }: { onClose: () => void, filters: Filters, onFiltersChange: (f: Filters) => void }) {
    const handleCategoryToggle = (category: string) => {
        const newCategories = new Set(filters.categories);
        if (newCategories.has(category)) newCategories.delete(category);
        else newCategories.add(category);
        onFiltersChange({ ...filters, categories: newCategories });
    };

    const handleSourceToggle = (source: string) => {
        const newSources = new Set(filters.sources);
        if (newSources.has(source)) newSources.delete(source);
        else newSources.add(source);
        onFiltersChange({ ...filters, sources: newSources });
    };

    return (
        <Modal onClose={onClose} title="Personalize Feed">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-orbitron text-brand-text-muted mb-3">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => handleCategoryToggle(cat)} className={`px-3 py-1 rounded-full text-sm border transition-colors ${filters.categories.has(cat) ? 'bg-brand-primary text-white border-brand-primary' : 'bg-brand-bg border-brand-text-muted hover:border-brand-primary hover:text-brand-primary'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-orbitron text-brand-text-muted mb-3">Sources</h3>
                    <div className="flex flex-wrap gap-2">
                        {SOURCES.map(src => (
                            <button key={src} onClick={() => handleSourceToggle(src)} className={`px-3 py-1 rounded-full text-sm border transition-colors ${filters.sources.has(src) ? 'bg-brand-secondary text-white border-brand-secondary' : 'bg-brand-bg border-brand-text-muted hover:border-brand-secondary hover:text-brand-secondary'}`}>
                                {src}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
}

function ChatBot({onClose}: {onClose: () => void}) {
    type Mode = 'chat' | 'image';
    const [mode, setMode] = useState<Mode>('chat');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [uploadedImage, setUploadedImage] = useState<{base64: string, mimeType: string, url: string} | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const url = URL.createObjectURL(file);
                const base64 = (reader.result as string).split(',')[1];
                setUploadedImage({ base64, mimeType: file.type, url });
            };
            reader.readAsDataURL(file);
        }
    }

    const handleSubmit = async () => {
        if (!input.trim() || isLoading) return;
        const userInput: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, image: uploadedImage?.url };
        setMessages(prev => [...prev, userInput]);
        const currentInput = input;
        const currentUploadedImage = uploadedImage;
        setInput('');
        setUploadedImage(null);
        setIsLoading(true);

        try {
            if (mode === 'image' && !currentUploadedImage) {
                const imageBase64 = await gemini.generateImageFromPrompt(currentInput, aspectRatio);
                const modelResponse: ChatMessage = { id: Date.now().toString(), role: 'model', content: `Generated image for: "${currentInput}"`, image: `data:image/png;base64,${imageBase64}` };
                setMessages(prev => [...prev, modelResponse]);
            } else if (mode === 'chat' && currentUploadedImage) {
                 const modelResponseId = (Date.now() + 1).toString();
                 setMessages(prev => [...prev, { id: modelResponseId, role: 'model', content: '' }]);
                 const resultText = await gemini.analyzeImage(currentInput, currentUploadedImage.base64, currentUploadedImage.mimeType);
                 setMessages(prev => prev.map(m => m.id === modelResponseId ? { ...m, content: resultText } : m));
            } else {
                const modelResponseId = (Date.now() + 1).toString();
                setMessages(prev => [...prev, { id: modelResponseId, role: 'model', content: '' }]);
                const stream = await gemini.getChat().sendMessageStream({ message: currentInput });
                let text = '';
                for await (const chunk of stream) {
                    text += chunk.text;
                    setMessages(prev => prev.map(m => m.id === modelResponseId ? { ...m, content: text } : m));
                }
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            const errorResponse: ChatMessage = { id: Date.now().toString(), role: 'model', content: 'Sorry, I encountered an error.' };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-[70vh] max-h-[600px] bg-brand-surface rounded-lg shadow-2xl flex flex-col border border-brand-primary/30 animate-slideUp z-40">
            <header className="p-3 flex justify-between items-center border-b border-brand-primary/20">
                <div className="flex items-center gap-2">
                    <BoltIcon className="text-brand-secondary"/>
                    <h2 className="font-orbitron text-brand-primary">AI Assistant</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-bg" aria-label="Close chat"><XIcon className="w-5 h-5"/></button>
            </header>
            <div className="p-2 border-b border-brand-primary/20">
                <div className="flex bg-brand-bg rounded-md p-1">
                    <button onClick={() => setMode('chat')} className={`w-1/2 rounded p-1 text-sm ${mode === 'chat' ? 'bg-brand-primary text-white' : ''}`}>Chat</button>
                    <button onClick={() => setMode('image')} className={`w-1/2 rounded p-1 text-sm ${mode === 'image' ? 'bg-brand-primary text-white' : ''}`}>Image</button>
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-brand-primary text-white' : 'bg-brand-bg'}`}>
                            {msg.image && <img src={msg.image} alt="content" className="rounded-md mb-2 max-h-40"/>}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 text-xs border-t border-brand-primary/20 pt-2">
                                    <h4 className="font-bold mb-1">Sources:</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                        {msg.sources.map((s, i) => s.web && <li key={i}><a href={s.web.uri} target="_blank" rel="noopener noreferrer" className="hover:underline">{s.web.title || s.web.uri}</a></li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            {isLoading && <div className="p-4 text-sm text-brand-text-muted italic">AI is thinking...</div>}
            <div className="p-3 border-t border-brand-primary/20">
                 {mode === 'image' && !uploadedImage &&
                     <div className="flex items-center justify-between mb-2">
                         <label className="text-sm text-brand-text-muted">Aspect Ratio:</label>
                         <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="bg-brand-bg border border-brand-primary/30 rounded-md p-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary">
                             <option value="1:1">1:1</option>
                             <option value="16:9">16:9</option>
                             <option value="9:16">9:16</option>
                             <option value="4:3">4:3</option>
                             <option value="3:4">3:4</option>
                         </select>
                     </div>
                 }
                 {uploadedImage && 
                    <div className="mb-2 flex items-center gap-2">
                        <img src={uploadedImage.url} alt="upload preview" className="w-10 h-10 rounded object-cover"/>
                        <p className="text-xs text-brand-text-muted flex-1 truncate">Image selected. Ask a question.</p>
                        <button onClick={() => setUploadedImage(null)}><XIcon className="w-4 h-4 text-brand-text-muted hover:text-white"/></button>
                    </div>
                 }
                <div className="relative">
                    <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}}
                           placeholder={mode === 'chat' ? (uploadedImage ? "Ask about the image..." : "Ask a question...") : 'Describe an image to generate...'}
                           className="w-full bg-brand-bg border border-brand-primary/30 rounded-lg p-2 pr-20 resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary" rows={2}/>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        {mode === 'chat' && (
                             <label htmlFor="file-upload" className="p-2 rounded-full hover:bg-brand-bg cursor-pointer"><UploadIcon className="w-5 h-5 text-brand-text-muted"/></label>
                        )}
                        <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload}/>
                        <button onClick={handleSubmit} disabled={isLoading} className="p-2 rounded-full bg-brand-primary text-white hover:bg-blue-500 disabled:bg-gray-600"><SendIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LiveAgentModal({ onClose }: { onClose: () => void }) {
    const [status, setStatus] = useState<LiveAgentStatus>('IDLE');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const startConversation = async () => {
        setStatus('CONNECTING');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });

            sessionPromiseRef.current = gemini.connectToLiveAgent({
                onopen: () => {
                    setStatus('LISTENING');
                    const source = audioContextRef.current!.createMediaStreamSource(stream);
                    const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromiseRef.current?.then((session) => {
                          session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(audioContextRef.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                     if (message.serverContent?.inputTranscription) {
                        currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                    }
                    if (message.serverContent?.outputTranscription) {
                        currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                    }
                     if (message.serverContent?.turnComplete) {
                        const fullInput = currentInputTranscriptionRef.current;
                        const fullOutput = currentOutputTranscriptionRef.current;
                        
                        setTranscript(prev => {
                            const newEntries: TranscriptEntry[] = [];
                            if (fullInput) {
                                newEntries.push({ speaker: 'user', text: fullInput });
                            }
                            if (fullOutput) {
                                newEntries.push({ speaker: 'cygnus', text: fullOutput });
                            }
                            return newEntries.length > 0 ? [...prev, ...newEntries] : prev;
                        });

                        currentInputTranscriptionRef.current = '';
                        currentOutputTranscriptionRef.current = '';
                    }

                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                    if (audioData && outputAudioContextRef.current) {
                        setStatus('SPEAKING');
                        const ctx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination);
                        source.addEventListener('ended', () => {
                            sourcesRef.current.delete(source);
                            if (sourcesRef.current.size === 0) {
                                setStatus('LISTENING');
                            }
                        });
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live agent error:', e);
                    setStatus('ERROR');
                },
                onclose: (e: CloseEvent) => {
                    setStatus('IDLE');
                    stream.getTracks().forEach(track => track.stop());
                    audioContextRef.current?.close();
                    outputAudioContextRef.current?.close();
                }
            });
        } catch (error) {
            console.error('Failed to start conversation:', error);
            setStatus('ERROR');
        }
    };

    const stopConversation = () => {
        sessionPromiseRef.current?.then(session => session.close());
    };

    useEffect(() => {
        startConversation();
        return () => {
            stopConversation();
        };
    }, []);

    const { text, color } = LIVE_AGENT_STATUS[status];

    return (
        <Modal onClose={() => { stopConversation(); onClose(); }} title="Live Conversation Agent">
            <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
                <div className="relative w-48 h-48 flex items-center justify-center">
                    <div className={`absolute inset-0 rounded-full ${color} ${status === 'LISTENING' || status === 'SPEAKING' ? 'animate-pulse' : ''} transition-colors`}></div>
                    <MicIcon className="w-24 h-24 text-white z-10"/>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-orbitron">{text}</p>
                    <p className="text-brand-text-muted">AI Assistant "Cygnus" is online.</p>
                </div>
                <div className="w-full h-32 bg-brand-bg rounded-lg p-3 overflow-y-auto">
                    {transcript.map((entry, i) => (
                        <p key={i} className={entry.speaker === 'user' ? 'text-brand-text' : 'text-brand-primary'}>
                            <span className="font-bold capitalize">{entry.speaker}: </span>{entry.text}
                        </p>
                    ))}
                </div>
            </div>
        </Modal>
    )
}

function AudioGenerationModal({ onClose, articles }: { onClose: () => void, articles: Article[] }) {
    // This is a simplified version of the spec for brevity.
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [audioB64, setAudioB64] = useState<string | null>(null);

    const generate = async () => {
        if (!text) return;
        setIsLoading(true);
        setAudioB64(null);
        let msgIndex = 0;
        const interval = setInterval(() => {
            setStatusMessage(AUDIO_GENERATION_MESSAGES[msgIndex % AUDIO_GENERATION_MESSAGES.length]);
            msgIndex++;
        }, 500);

        try {
            const result = await gemini.generateSpeech(text, 'english', false);
            setAudioB64(result);
        } catch (error) {
            console.error(error);
            setStatusMessage("Error generating audio.");
        } finally {
            clearInterval(interval);
            setIsLoading(false);
            if(!audioB64) setStatusMessage('');
        }
    }

    return (
        <Modal onClose={onClose} title="Audio Synthesis Agent">
             <div className="space-y-4">
                 <textarea value={text} onChange={e => setText(e.target.value)}
                           placeholder="Type text or a news broadcast script here..."
                           className="w-full h-40 bg-brand-bg border border-brand-primary/30 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
                           />
                <div className="flex items-center gap-4">
                     <button onClick={generate} disabled={isLoading} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-400 disabled:bg-gray-500 flex items-center">
                         {isLoading ? <LoaderIcon className="w-5 h-5 mr-2"/> : <SoundWaveIcon className="w-5 h-5 mr-2"/>}
                         Generate Speech
                     </button>
                    {isLoading && <p className="text-brand-text-muted">{statusMessage}</p>}
                </div>
                {audioB64 && (
                    <div className="mt-4">
                        <h3 className="font-bold mb-2">Generated Audio:</h3>
                        <audio controls src={`data:audio/webm;base64,${audioB64}`} className="w-full"></audio>
                    </div>
                )}
             </div>
        </Modal>
    );
}