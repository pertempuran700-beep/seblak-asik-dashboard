'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { loginWithGoogleToken, getSession } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (getSession()) router.push('/dashboard');
  }, []);

  async function handleSuccess(res) {
    try {
      const user = await loginWithGoogleToken(res.credential);
      router.push('/dashboard');
    } catch (err) {
      toast?.showToast(err.message, 'error');
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-bg relative">
      
      {/* AREA ANIMASI 1 MILYAR */}
      <div className="relative w-full max-w-md h-64 mb-8 flex justify-center items-end">
        {/* Karakter Pria Berkacamata Mengetik (SVG/Emoji representasi) */}
        <div className="relative z-10 text-[80px] leading-none animate-bounce-slow">
          👨‍💻
          {/* Mangkuk Seblak Kecil */}
          <div className="absolute -bottom-2 -right-4 text-2xl">🍜</div>
        </div>

        {/* Bubble 1: Bismillah */}
        <div className="absolute top-16 right-4 bg-white text-black font-bold px-4 py-2 rounded-2xl rounded-bl-none shadow-xl opacity-0 animate-bubble-1 text-sm z-20">
          Bismillah 1 Milyar pertama di usia 25! 🙏
        </div>

        {/* Bubble 2: Brands */}
        <div className="absolute top-6 left-0 bg-primary text-white font-bold px-4 py-2 rounded-2xl rounded-br-none shadow-xl opacity-0 animate-bubble-2 text-xs z-20 flex flex-col gap-1">
          <span>✨ Cuanki Kang Asik</span>
          <span>🔥 Bakso PMS</span>
          <span>🌶️ Sembara</span>
          <span>🌿 Floasis</span>
        </div>
      </div>

      <div className="w-full max-w-sm text-center z-30">
        <h1 className="text-3xl font-black mb-1 text-white">Seblak Asik ERP</h1>
        <p className="text-textmuted text-sm mb-8">Sistem Manajemen & Operasional Terpadu</p>

        <div className="bg-surface border border-white/[0.08] rounded-card p-6 shadow-2xl backdrop-blur-sm">
          <p className="text-sm text-textmuted mb-5">Otentikasi Workspace Karyawan</p>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="flex justify-center">
              <GoogleLogin onSuccess={handleSuccess} theme="filled_black" shape="pill" />
            </div>
          </GoogleOAuthProvider>
        </div>
      </div>

      {/* Tambahkan style animasi ini di globals.css */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes bubble-1 { 0%, 10% { opacity: 0; transform: translateY(10px) scale(0.9); } 15%, 45% { opacity: 1; transform: translateY(0) scale(1); } 50%, 100% { opacity: 0; } }
        @keyframes bubble-2 { 0%, 50% { opacity: 0; transform: translateY(10px) scale(0.9); } 55%, 95% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; } }
        
        .animate-bounce-slow { animation: bounce-slow 1s infinite; }
        .animate-bubble-1 { animation: bubble-1 8s infinite; }
        .animate-bubble-2 { animation: bubble-2 8s infinite; }
      `}} />
    </main>
  );
}
