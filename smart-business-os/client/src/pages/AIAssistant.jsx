import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, TrendingUp, BarChart3, DollarSign, HelpCircle, Mic } from 'lucide-react';
import api from '../services/api';

const QUICK_PROMPTS = [
  { icon: TrendingUp, text: 'Show my weekly sales' },
  { icon: BarChart3, text: 'Which category has highest expense?' },
  { icon: DollarSign, text: 'What is my profit this month?' },
  { icon: HelpCircle, text: 'Show recent transactions' }
];

const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={isUser ? { background: 'linear-gradient(135deg,#6366f1,#ec4899)' } : { background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-indigo-400" />}
      </div>
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
        style={isUser ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' } : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
        {msg.content.split('\n').map((line, i) => (
          <React.Fragment key={i}>{line}<br /></React.Fragment>
        ))}
        <p className="text-xs mt-1.5 opacity-60">{new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
};

const AIAssistant = () => {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '🤖 Hello! I\'m your AI Business Assistant.\n\nI can help you analyze your business data. Try:\n• "Show my weekly sales"\n• "What is my profit?"\n• "Highest expense category"\n\nType "help" for all commands!',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { api.get('/ai/prediction').then(res => setPrediction(res.data.data)).catch(() => {}); }, []);

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { query: text.trim() });
      setMessages(prev => [...prev, { role: 'assistant', content: data.data.response, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Sorry, I encountered an error. Please try again.', timestamp: new Date() }]);
    } finally { setLoading(false); inputRef.current?.focus(); }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) { alert('Voice input requires Chrome browser!'); return; }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onresult = e => { const t = e.results[0][0].transcript; setInput(t); sendMessage(t); };
    recognition.start();
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-fadeInUp" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Assistant</h1><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Powered by business intelligence engine</p></div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)' }}>
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>AI Online</span>
        </div>
      </div>

      {prediction?.prediction && (
        <div className="card p-4 flex items-center gap-4 border-l-4" style={{ borderLeftColor: '#6366f1' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <TrendingUp size={20} style={{ color: '#6366f1' }} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>AI PREDICTION — Next Month</p>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{prediction.message}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Confidence: {prediction.confidence} · Trend: {prediction.trend}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map(({ icon: Icon, text }) => (
          <button key={text} onClick={() => sendMessage(text)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:shadow-md"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <Icon size={13} />{text}
          </button>
        ))}
      </div>

      <div className="flex-1 card p-4 overflow-y-auto space-y-4" style={{ minHeight: 300 }}>
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
              <Bot size={14} className="text-indigo-400" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex gap-1 items-center h-5">
                {[0, 0.15, 0.3].map((delay, i) => <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: `${delay}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="card p-3 flex gap-3 items-center">
        <button onClick={handleVoiceInput} className="p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20"><Mic size={18} style={{ color: 'var(--accent)' }} /></button>
        <input ref={inputRef} type="text" className="flex-1 outline-none bg-transparent text-sm" style={{ color: 'var(--text-primary)' }}
          placeholder='Ask anything... e.g. "Show my monthly profit"' value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="p-2.5 rounded-xl text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
export default AIAssistant;
