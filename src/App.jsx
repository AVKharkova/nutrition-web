import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { supabase, configured } from './lib/supabase';
import { getMyUserId, fetchProfile } from './lib/api';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Diary from './pages/Diary';
import IslandsPage from './pages/IslandsPage';
import ProfilePage from './pages/ProfilePage';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function Toast({ msg }) {
  if (!msg) return null;
  return <div className={'ks-toast' + (msg.warn ? ' is-warning' : '')}>{msg.text}</div>;
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = загрузка
  const [uid, setUid] = useState(null);              // tg user_id (bigint)
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((text, warn = false) => {
    setToast({ text, warn });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const reloadLink = useCallback(async () => {
    try {
      const id = await getMyUserId();
      setUid(id);
      if (id) setProfile(await fetchProfile(id));
    } catch (e) {
      console.error(e);
      setUid(null);
    }
  }, []);

  useEffect(() => {
    if (!configured) { setSession(null); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) reloadLink();
    else { setUid(null); setProfile(null); }
  }, [session, reloadLink]);

  if (!configured) {
    return (
      <div className="auth-wrap">
        <div className="ks-card auth-card">
          <span className="ks-eyebrow">Настройка</span>
          <h2 style={{ margin: '8px 0 12px' }}>Нет конфигурации</h2>
          <p className="ks-muted">
            Заполни файл <strong>.env</strong> в корне проекта (см. .env.example):
            URL и anon key из Supabase, адрес вебхука n8n. Затем перезапусти dev-сервер.
          </p>
        </div>
      </div>
    );
  }

  if (session === undefined) {
    return <div className="auth-wrap"><div className="ks-skeleton" style={{ width: 360, height: 200 }} /></div>;
  }

  const ctx = { session, uid, profile, setProfile, reloadLink, showToast };

  if (!session) {
    return (
      <Ctx.Provider value={ctx}>
        <AuthPage />
        <Toast msg={toast} />
      </Ctx.Provider>
    );
  }

  return (
    <Ctx.Provider value={ctx}>
      <div className="app-shell">
        <header className="app-header">
          <div className="ks-brand">
            <div className="ks-mark" />
            <span className="ks-wordmark">Nutrition</span>
          </div>
          <nav className="app-nav">
            <NavLink to="/" end>Сегодня</NavLink>
            <NavLink to="/diary">Дневник</NavLink>
            <NavLink to="/islands">Острова</NavLink>
            <NavLink to="/profile">Профиль</NavLink>
          </nav>
          <button className="ks-button ks-button-ghost ks-button-sm" onClick={() => supabase.auth.signOut()}>
            Выйти
          </button>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/islands" element={<IslandsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <span className="ks-mono">Nutrition · дневник питания и острова личности · общие данные с Telegram-ботом</span>
        </footer>
      </div>
      <Toast msg={toast} />
    </Ctx.Provider>
  );
}
