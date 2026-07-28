/**
 * app/api/proxy/route.js — proxy server-side ke Google Apps Script Web App.
 */

export async function POST(request) {
  const body = await request.json();
  
  // URL Deployment Terbaru Apps Script Anda:
  const gasUrl = "https://script.google.com/macros/s/AKfycbynpgOdbKuDzFswLE6j03TW2Zgk08xwP8NWzDzNm4ju8L5gA79HSFThkEOHHjtyV7U/exec";

  try {
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
      redirect: 'follow',
      cache: 'no-store' // <--- KUNCI UTAMA: Memaksa website selalu mengambil data paling baru detik ini juga
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
