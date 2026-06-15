import React, { useEffect, useRef } from 'react';
import { TG_BOT } from '../lib/supabase';

/* Telegram Login Widget в callback-режиме. onAuth получает подписанный payload. */
export default function TelegramLogin({ onAuth }) {
  const slot = useRef(null);

  useEffect(() => {
    const fnName = '__tgAuthCb_' + Math.random().toString(36).slice(2);
    window[fnName] = (user) => onAuth(user);

    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    s.setAttribute('data-telegram-login', TG_BOT);
    s.setAttribute('data-size', 'large');
    s.setAttribute('data-radius', '4');
    s.setAttribute('data-onauth', fnName + '(user)');
    s.setAttribute('data-request-access', 'write');
    slot.current?.appendChild(s);

    return () => {
      delete window[fnName];
      if (slot.current) slot.current.innerHTML = '';
    };
  }, [onAuth]);

  return <div className="tg-widget-slot" ref={slot} />;
}
