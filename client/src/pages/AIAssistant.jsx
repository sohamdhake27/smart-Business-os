import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, TrendingUp, BarChart3, DollarSign, HelpCircle } from 'lucide-react';
import { getPrediction, sendChat } from '../api/ai.api';
import EmptyState from '../components/state/EmptyState';

const QUICK_PROMPTS = [
  { icon: TrendingUp, text: 'Show my weekly sales' },
  { icon: BarChart3, text: 'Which category has the highest expense?' },
  { icon: DollarSign, text: 'What is my profit this month?' },
  { icon: HelpCircle, text: 'Give me 3 ways to improve profit' }
];

const Message = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={isUser ? { background: 'linear-gradient(135deg,#0f766e,#14b8a6)' } : { background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
        {isUser ? <span className="text-xs font-bold text-white">You</span> : <Bot size={14} className="text-cyan-300" />}
      </div>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
        style={isUser ? { background: 'linear-gradient(135deg,#0f766e,#14b8a6)', color: 'white' } : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      >
        {message.content.split('\n').map((line, index) => (
          <React.Fragment key={`${line}-${index}`}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Ask about sales, expenses, profit, or improvement ideas. I will answer using your current business data.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    getPrediction()
      .then((response) => setPrediction(response.data.data))
      .catch(() => setPrediction(null));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submitPrompt = async (prompt = input) => {
    if (!prompt.trim() || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: prompt.trim() }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await sendChat(prompt.trim());
      setMessages((prev) => [...prev, { role: 'assistant', content: data.data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'I hit an error while reading your data. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Assistant</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Trend prediction, smart alerts, and business suggestions</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(20,184,166,0.1)' }}>
          <Sparkles size={14} style={{ color: '#0f766e' }} />
          <span className="text-xs font-semibold" style={{ color: '#0f766e' }}>AI Online</span>
        </div>
      </div>

      {prediction?.prediction ? (
        <div className="card p-4 flex items-center gap-4 border-l-4" style={{ borderLeftColor: '#0f766e' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(20,184,166,0.12)' }}>
            <TrendingUp size={20} style={{ color: '#0f766e' }} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>TREND PREDICTION</p>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{prediction.message}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Confidence: {prediction.confidence} | Trend: {prediction.trend}</p>
          </div>
        </div>
      ) : (
        <EmptyState title="Prediction unavailable" description="Add at least two months of sales data to unlock forecasting." />
      )}

      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map(({ icon: Icon, text }) => (
          <button key={text} onClick={() => submitPrompt(text)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:shadow-md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <Icon size={13} />
            {text}
          </button>
        ))}
      </div>

      <div className="card p-4 space-y-4 overflow-y-auto" style={{ minHeight: 420, maxHeight: 'calc(100vh - 240px)' }}>
        {messages.map((message, index) => (
          <Message key={`${message.role}-${index}`} message={message} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
              <Bot size={14} className="text-cyan-300" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              Thinking through your numbers...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="card p-3 flex gap-3 items-center">
        <input
          type="text"
          className="flex-1 outline-none bg-transparent text-sm"
          style={{ color: 'var(--text-primary)' }}
          placeholder='Ask about sales, profit, category trends, or recommendations'
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && submitPrompt()}
        />
        <button onClick={() => submitPrompt()} disabled={!input.trim() || loading} className="p-2.5 rounded-xl text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;
