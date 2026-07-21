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

  async function handleSuccess(credentialResponse) {
    try {
      const user = await loginWithGoogleToken(credentialResponse.credential);
      toast?.showToast('Selamat datang, ' + user.full_name);
      router.push('/dashboard');
    } catch (err) {
      toast?.showToast(err.message, 'error');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">🌶️</div>
        <h1 className="text-2xl font-bold mb-1">Seblak Asik</h1>
        <p className="text-textmuted text-sm mb-8">Sistem Keuangan &amp; Operasional</p>

        <div className="bg-surface border border-white/[0.08] rounded-card p-6">
          <p className="text-sm text-textmuted mb-5">Masuk dengan akun Google yang terdaftar sebagai karyawan</p>
          {GOOGLE_CLIENT_ID ? (
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => toast?.showToast('Login gagal, coba lagi', 'error')}
                  theme="filled_black"
                  shape="pill"
                />
              </div>
            </GoogleOAuthProvider>
          ) : (
            <p className="text-danger text-xs">
              NEXT_PUBLIC_GOOGLE_CLIENT_ID belum diset di environment variables.
            </p>
          )}
        </div>

        <p className="text-textmuted text-xs mt-6">
          Belum punya akses? Hubungi Owner untuk didaftarkan sebagai karyawan.
        </p>
      </div>
    </main>
  );
}
