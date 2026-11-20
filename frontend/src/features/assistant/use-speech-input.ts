'use client';

import { useEffect, useRef, useState } from 'react';

// lib.dom của TypeScript chưa khai báo SpeechRecognition: chỉ mô tả phần đang dùng.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

const NO_SERVICE =
  'Không nhận được giọng nói. Chỉ Chrome và Edge có dịch vụ nhận dạng giọng nói; Opera, Brave, Cốc Cốc hay Firefox thì chưa, bạn hãy mở trang bằng Chrome hoặc Edge.';
const NO_SPEECH = 'Không nghe thấy tiếng nói, bạn kiểm tra micro rồi thử lại nhé.';

function recognitionCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const join = (...parts: string[]) => parts.filter(Boolean).join(' ');

/**
 * Nói thay vì gõ (Web Speech API, tiếng Việt): nghe liên tục cho tới khi người dùng bấm dừng,
 * lời nói được nối vào sau `text` và cập nhật dần qua `setText`.
 */
export function useSpeechInput(text: string, setText: (value: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  // 'stop': người dùng bấm dừng (giữ lời đã nói); 'cancel': đã gửi tin, bỏ phần đang nghe dở.
  const ended = useRef<'stop' | 'cancel' | null>(null);

  useEffect(
    () => () => {
      ended.current = 'cancel';
      rec.current?.abort();
    },
    [],
  );

  /** Bỏ phiên đang nghe mà không điền thêm chữ (dùng khi đã gửi tin nhắn). */
  const cancel = () => {
    ended.current = 'cancel';
    rec.current?.abort();
  };

  const toggle = () => {
    if (rec.current) {
      ended.current = 'stop';
      return rec.current.stop();
    }
    const Ctor = recognitionCtor();
    if (!Ctor) return setError(NO_SERVICE);
    const r = new Ctor();
    r.lang = 'vi-VN';
    r.interimResults = true;
    r.continuous = true;

    let base = text.trim();
    let latest = base;
    let heardAny = false;
    let heardNow = false; // phiên hiện tại có nghe được gì không
    let silent = false; // Chrome tự ngắt sau một quãng im lặng (no-speech): nghe tiếp
    let problem: string | null = null;

    r.onresult = (e) => {
      if (ended.current === 'cancel') return;
      const said = Array.from(e.results, (res) => res[0].transcript).join('').trim();
      if (said) heardAny = heardNow = true;
      latest = join(base, said);
      setText(latest);
    };
    r.onerror = (e) => {
      if (e.error === 'aborted') return;
      if (e.error === 'no-speech') silent = true;
      else
        problem =
          e.error === 'not-allowed'
            ? 'Micro đang bị chặn: bấm biểu tượng ổ khoá trên thanh địa chỉ và cho phép micro.'
            : e.error === 'audio-capture'
              ? NO_SPEECH
              : NO_SERVICE;
    };
    r.onend = () => {
      // Trình duyệt tự kết thúc phiên (im lặng, hết thời lượng): mở phiên mới cho tới khi người dùng bấm dừng.
      // Phiên kết thúc mà không nghe gì và không lỗi (Opera, Brave…) thì không mở lại, tránh lặp vô hạn.
      if (!ended.current && !problem && (heardNow || silent)) {
        base = latest;
        heardNow = silent = false;
        r.start();
        return;
      }
      rec.current = null;
      setListening(false);
      if (ended.current === 'cancel') return;
      if (problem || !heardAny) setError(problem ?? (ended.current === 'stop' ? NO_SPEECH : NO_SERVICE));
    };

    ended.current = null;
    setError(null);
    rec.current = r;
    r.start();
    setListening(true);
  };

  return { listening, error, toggle, cancel };
}
