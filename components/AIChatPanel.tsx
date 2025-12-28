
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { askNomExpert } from '../services/geminiService';
import { ChatMessage } from '../types';

const AIChatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: '¡Hola! Soy tu asistente experto en la NOM-001-SEDE-2012. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [useThinkingMode, setUseThinkingMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const processQuery = useCallback(async (queryText: string) => {
    if (!queryText.trim() || isThinking) return;

    setMessages(prev => [...prev, { role: 'user', content: queryText }]);
    setIsThinking(true);
    setIsOpen(true);

    try {
      const result = await askNomExpert(queryText, useThinkingMode);
      setMessages(prev => [...prev, { role: 'model', content: result.text }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: 'Lo siento, ocurrió un error al procesar tu consulta. Revisa tu conexión o API Key.' }]);
    } finally {
      setIsThinking(false);
    }
  }, [isThinking, useThinkingMode]);

  useEffect(() => {
    const handleExternalQuery = (e: any) => {
      if (e.detail) {
        processQuery(e.detail);
      }
    };
    window.addEventListener('nom-ai-query', handleExternalQuery);
    return () => window.removeEventListener('nom-ai-query', handleExternalQuery);
  }, [processQuery]);

  const handleSend = () => {
    const text = input;
    setInput('');
    processQuery(text);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 size-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
      >
        <span className="material-symbols-outlined text-3xl">{isOpen ? 'close' : 'smart_toy'}</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-4 bg-primary text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">psychology</span>
              <div>
                <h3 className="font-bold text-sm">Consultor Normativo AI</h3>
                <p className="text-[10px] opacity-80">Powered by Gemini 3 Pro</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <button 
                onClick={() => setUseThinkingMode(!useThinkingMode)}
                className={`text-[10px] px-2 py-1 rounded border ${useThinkingMode ? 'bg-white/20 border-white' : 'bg-transparent border-white/40'}`}
                title="Habilitar razonamiento profundo (Thinking Budget)"
               >
                 Thinking: {useThinkingMode ? 'ON' : 'OFF'}
               </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-gray-100 dark:bg-[#283039] text-[#111418] dark:text-white rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-[#283039] p-3 rounded-2xl rounded-tl-none flex gap-1">
                  <div className="size-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="size-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="size-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  <span className="text-[10px] text-text-secondary ml-2">Razonando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-border-dark flex gap-2 items-center shrink-0">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ej: ¿Cúal es el ampacidad de un 1/0 THHW?"
              className="flex-1 bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={isThinking}
              className="size-10 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-50"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatPanel;
