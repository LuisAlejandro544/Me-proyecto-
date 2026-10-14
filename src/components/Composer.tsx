import { useState } from 'react';

const MOODS = ['ansiedad', '3am', 'desahogo', 'losercore', 'humor', 'reflexión'];
const MAX = 280;

export default function Composer({ onPublish, posting }: { onPublish: (text: string, mood: string | null) => Promise<void>; posting: boolean }) {
  const [text, setText] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const over = text.length > MAX;

  const submit = async () => {
    if (!text.trim() || over || posting) return;
    await onPublish(text.trim(), mood);
    setText('');
    setMood(null);
  };

  return (
    <div className="composer">
      <div className="avatar">🫵</div>
      <div style={{ flex: 1 }}>
        <textarea
          id="composer-box"
          placeholder="¿Con qué te proyectaste hoy? (280 caracteres)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="composer-row">
          <div className="mood-row">
            {MOODS.map((m) => (
              <button key={m} className={`mood ${mood === m ? 'selected' : ''}`} onClick={() => setMood(mood === m ? null : m)}>
                #{m}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`char ${over ? 'over' : ''}`}>{text.length}/{MAX}</span>
            <button className="btn btn-primary" style={{ width: 'auto', marginTop: 0 }} disabled={!text.trim() || over || posting} onClick={submit}>
              {posting ? 'Proyectando…' : 'Proyectar ✍️'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
