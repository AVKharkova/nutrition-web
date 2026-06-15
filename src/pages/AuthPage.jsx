import React, { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { tgAuth } from '../lib/api';
import TelegramLogin from '../ui/TelegramLogin';
import { useApp } from '../App';

export default function AuthPage() {
  const { showToast } = useApp();
  const [tab, setTab] = useState('tg');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const sendLink = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + window.location.pathname },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      showToast('Не получилось отправить письмо: ' + err.message, true);
    } finally {
      setBusy(false);
    }
  };

  const onTg = useCallback(async (user) => {
    setBusy(true);
    try {
      const res = await tgAuth(user);
      if (res.error) throw new Error(res.error);
      if (!res.token_hash) throw new Error('сервис не вернул токен');
      const { error } = await supabase.auth.verifyOtp({ type: 'email', token_hash: res.token_hash });
      if (error) throw error;
      // onAuthStateChange в App подхватит сессию
    } catch (err) {
      showToast('Вход через Telegram не удался: ' + err.message, true);
    } finally {
      setBusy(false);
    }
  }, [showToast]);

  return (
    <div className="auth-wrap">
      <div className="ks-card auth-card">
        <div className="ks-brand" style={{ marginBottom: 8 }}>
          <div className="ks-mark" />
          <span className="ks-wordmark">Nutrition</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.2rem)' }}>Твой дневник<br />питания и островов</h1>
        <div className="auth-seam" />
        <p className="ks-muted" style={{ marginTop: 0 }}>
          Тот же помощник, что и в Telegram: КБЖУ по фото, вода, Пульт Эмоций
          и Острова Личности — теперь с большим экраном.
        </p>

        <div className="auth-tabs">
          <button className={tab === 'tg' ? 'active' : ''} onClick={() => setTab('tg')}>Через Telegram</button>
          <button className={tab === 'email' ? 'active' : ''} onClick={() => setTab('email')}>По почте</button>
        </div>

        {tab === 'tg' && (
          <div>
            <TelegramLogin onAuth={onTg} />
            <p className="ks-faint" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
              Войди тем же Telegram-аккаунтом, которым пользуешься в боте —
              дневник и острова подтянутся автоматически.
            </p>
          </div>
        )}

        {tab === 'email' && !sent && (
          <form onSubmit={sendLink}>
            <div className="ks-field">
              <label className="ks-label">Email</label>
              <input className="ks-input" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <button className="ks-button ks-button-primary" style={{ width: '100%' }} disabled={busy}>
              Прислать ссылку для входа
            </button>
            <p className="ks-faint" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
              Пароль не нужен: придёт письмо с одноразовой ссылкой.
              После входа можно привязать Telegram, чтобы видеть данные бота.
            </p>
          </form>
        )}

        {tab === 'email' && sent && (
          <div className="ks-empty">
            Письмо отправлено на <strong>{email}</strong>.<br />
            Открой ссылку из письма — и ты внутри.
          </div>
        )}
      </div>
    </div>
  );
}
