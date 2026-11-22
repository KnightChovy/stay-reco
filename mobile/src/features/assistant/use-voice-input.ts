import { useEffect, useRef, useState } from 'react';
import { alert } from '@/lib/alert';

type Speech = typeof import('expo-speech-recognition');
// Expo Go không có module native này (require ném lỗi): bắt lại để app vẫn chạy, nút mic chỉ báo cần bản dev build.
let speech: Speech | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- import tĩnh sẽ làm sập cả app trên Expo Go
  speech = require('expo-speech-recognition');
} catch {}

const NO_SPEECH = 'Không nghe thấy tiếng nói, bạn kiểm tra micro rồi thử lại nhé.';
const NO_SERVICE =
  'Thiết bị hoặc trình duyệt này không có dịch vụ nhận dạng giọng nói. Trên máy tính, chỉ Chrome và Edge có (Opera, Brave, Cốc Cốc, Firefox thì chưa).';
const OPTIONS = { lang: 'vi-VN', interimResults: true, continuous: true };

const join = (...parts: string[]) => parts.filter(Boolean).join(' ');

type Session = {
  base: string; // chữ có sẵn trước phiên hiện tại
  committed: string; // các đoạn đã chốt (isFinal) của phiên hiện tại
  latest: string;
  heardAny: boolean;
  heardNow: boolean;
  silent: boolean; // hệ thống tự ngắt vì im lặng (no-speech): nghe tiếp
  problem: string | null;
  ended: 'stop' | 'cancel' | null; // 'stop': người dùng bấm dừng; 'cancel': đã gửi tin, bỏ phần dở
};

/**
 * Nói thay vì gõ (tiếng Việt): nghe liên tục cho tới khi người dùng bấm dừng, lời nói được nối vào sau `text`
 * và cập nhật dần qua `setText` (nên là setter của useState để không đăng ký lại sự kiện mỗi lần render).
 */
export function useVoiceInput(text: string, setText: (value: string) => void) {
  const [listening, setListening] = useState(false);
  const s = useRef<Session | null>(null);

  useEffect(() => {
    if (!speech) return;
    const m = speech.ExpoSpeechRecognitionModule;
    const subs = [
      m.addListener('start', () => setListening(true)),
      m.addListener('result', (e) => {
        const cur = s.current;
        if (!cur || cur.ended === 'cancel') return;
        // Chế độ liên tục trả từng đoạn: nối các đoạn đã chốt với đoạn đang nghe.
        const said = e.results[0]?.transcript?.trim() ?? '';
        if (said) cur.heardAny = cur.heardNow = true;
        if (e.isFinal) cur.committed = join(cur.committed, said);
        cur.latest = join(cur.base, cur.committed, e.isFinal ? '' : said);
        setText(cur.latest);
      }),
      m.addListener('error', (e) => {
        const cur = s.current;
        if (!cur || e.error === 'aborted') return;
        if (e.error === 'no-speech') cur.silent = true;
        else
          cur.problem =
            e.error === 'not-allowed'
              ? 'Bạn hãy cho phép StayReco dùng micro trong phần Cài đặt.'
              : e.error === 'audio-capture'
                ? NO_SPEECH
                : e.error === 'network' || e.error === 'service-not-allowed' || e.error === 'language-not-supported'
                  ? NO_SERVICE
                  : e.message;
      }),
      m.addListener('end', () => {
        const cur = s.current;
        if (!cur) return setListening(false);
        // Hệ thống tự kết thúc phiên (im lặng, Android 12-): mở phiên mới cho tới khi người dùng bấm dừng.
        // Kết thúc mà không nghe gì và không lỗi (Opera, Brave…) thì không mở lại, tránh lặp vô hạn.
        if (!cur.ended && !cur.problem && (cur.heardNow || cur.silent)) {
          Object.assign(cur, { base: cur.latest, committed: '', heardNow: false, silent: false });
          return m.start(OPTIONS);
        }
        s.current = null;
        setListening(false);
        if (cur.ended === 'cancel') return;
        if (cur.problem || !cur.heardAny) alert('Không nhận được giọng nói', cur.problem ?? (cur.ended === 'stop' ? NO_SPEECH : NO_SERVICE));
      }),
    ];
    return () => {
      if (s.current) s.current.ended = 'cancel';
      subs.forEach((sub) => sub.remove());
      m.abort();
    };
  }, [setText]);

  /** Bỏ phiên đang nghe mà không điền thêm chữ (dùng khi đã gửi tin nhắn). */
  const cancel = () => {
    if (!speech || !s.current) return;
    s.current.ended = 'cancel';
    speech.ExpoSpeechRecognitionModule.abort();
  };

  const toggle = async () => {
    if (!speech) return alert('Chưa hỗ trợ nhập bằng giọng nói', 'Expo Go không có nhận dạng giọng nói, hãy chạy app bằng bản dev build.');
    const m = speech.ExpoSpeechRecognitionModule;
    if (s.current) {
      s.current.ended = 'stop';
      return m.stop();
    }
    if (!m.isRecognitionAvailable()) return alert('Chưa hỗ trợ nhập bằng giọng nói', NO_SERVICE);
    const { granted } = await m.requestPermissionsAsync();
    if (!granted) return alert('Cần quyền micro', 'Bạn hãy cho phép StayReco dùng micro và nhận dạng giọng nói trong phần Cài đặt.');
    const base = text.trim();
    s.current = { base, committed: '', latest: base, heardAny: false, heardNow: false, silent: false, problem: null, ended: null };
    m.start(OPTIONS);
  };

  return { listening, toggle, cancel };
}
