/**
 * app/api/proxy/route.js — proxy server-side ke Google Apps Script Web App.
 */

// KUNCI UTAMA: Mematikan total sistem Cache / Memori bawaan Next.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  const body = await request.json();
  
  // URL Deployment Terbaru Apps Script Anda:
  const gasUrl = "https://script.google.com/macros/s/AKfycbwQuK8-SnN36_MnwK2mTmxAbF-HWVicNiNGhnlX0eoZJXxp06XKqY5ou8-xrLO2sFQP/exec";

  try {
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, 
      body: JSON.stringify(body),
      redirect: 'follow',
      cache: 'no-store' // Perintah tegas agar selalu menarik data segar dari Spreadsheet
    });
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { success: false, error: 'Gagal menghubungi backend: ' + err.message },
      { status: 502 }
    );
  }
}
