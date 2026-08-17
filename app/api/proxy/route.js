export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const maxDuration = 60; // butuh Vercel Pro plan untuk >10 detik di Node runtime

const gasUrl = "https://script.google.com/macros/s/AKfycbwQ3OHs52bdRcf7c5ETa2mSXhAE_kJRTsWbWR77gUtKrZjBylgKw4qgTBYsXmuuZHj_/exec";

export async function POST(request) {
  const body = await request.json();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const text = await res.text();

    try {
      const data = JSON.parse(text);
      return Response.json(data);
    } catch (parseErr) {
      let penyebab = "Error Tidak Diketahui";
      if (text.includes("Sign in") || text.includes("Google Accounts")) {
        penyebab = "IZIN AKSES TERTUTUP! Pastikan 'Siapa saja' (Anyone) di Apps Script.";
      } else if (text.includes("SyntaxError") || text.includes("Exception")) {
        penyebab = "ADA SALAH KETIK DI KODE Code.gs.";
      } else if (text.includes("timeout") || text.includes("Timeout")) {
        penyebab = "Google Script kelamaan merespon (server sedang sibuk).";
      }
      const snippet = text.substring(0, 80).replace(/\n/g, '');
      return Response.json(
        { success: false, error: `DETEKTIF BACA HTML: ${penyebab} | Isi asli: ${snippet}...` },
        { status: 502 }
      );
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return Response.json(
        { success: false, error: 'Server Google terlalu lama merespon (>55 detik). Silakan coba lagi.' },
        { status: 504 }
      );
    }
    return Response.json(
      { success: false, error: 'Gagal menghubungi backend: ' + err.message },
      { status: 502 }
    );
  }
}
