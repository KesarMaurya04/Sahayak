export default function ChatBubble({ who, text, at }: { who: 'user'|'agent'|'ai'; text: string; at: string }) {
  const align = who === 'user' ? 'justify-end' : 'justify-start';
  const bubble =
    who === 'user' ? 'bg-brand-600 text-white'
    : who === 'agent' ? 'bg-slate-800 text-white'
    : 'bg-slate-100';

  return (
    <div className={`flex ${align}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${bubble}`}>
        <div className="whitespace-pre-wrap text-sm">{text}</div>
        <div className={`mt-1 text-[10px] ${who==='ai'?'text-slate-500':'opacity-70'}`}>{new Date(at).toLocaleString('en-IN')}</div>
      </div>
    </div>
  );
}