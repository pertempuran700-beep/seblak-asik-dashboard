/**
 * app/api/proxy/route.js — proxy server-side ke Google Apps Script
 * Web App. Ini menghindari isu CORS (Apps Script tidak selalu
 * mengizinkan CORS langsung dari browser) dan menyembunyikan URL
 * Web App dari client bundle.
 *
 * Set GAS_WEB_APP_URL di Vercel > Project Settings > Environment
 * Variables, isi dengan URL hasil "Deploy > New deployment" di
 * Apps Script (diakhiri /exec).
 */

export async function POST(request) {
  const body = await request.json();
  const gasUrl = process.env.GAS_WEB_APP_URL;

  if (!gasUrl) {
    return Response.json(
      { success: false, error: 'GAS_WEB_APP_URL belum diset di environment variables' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow',
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
