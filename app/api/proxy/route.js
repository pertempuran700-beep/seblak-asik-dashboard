/**
 * app/api/proxy/route.js
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'edge'; 

export async function POST(request) {
  const body = await request.json();
  
  // PASTIKAN URL INI SAMA PERSIS DENGAN URL DEPLOYMENT TERBARU ANDA
  const gasUrl = "https://script.google.com/macros/s/AKfycbwQuK8-SnN36_MnwK2mTmxAbF-HWVicNiNGhnlX0eoZJXxp06XKqY5ou8-xrLO2sFQP/exec";

  try {
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, 
      body: JSON.stringify(body),
      redirect: 'follow',
      cache: 'no-store'
    });
    
    const text = await res.text(); // Tarik sebagai teks mentah dulu
    
    try {
      const data = JSON.parse(text); // Coba ubah ke JSON
      return Response.json(data);
    } catch (parseErr) {
      // 🚨 JIKA GOOGLE MENGIRIM HTML, KITA TANGKAP PENYEBABNYA DISINI!
      let penyebab = "Error Tidak Diketahui";
      
      if (text.includes("Sign in") || text.includes("Google Accounts")) {
        penyebab = "IZIN AKSES TERTUTUP! Pastikan 'Siapa saja' (Anyone) di Apps Script.";
      } else if (text.includes("SyntaxError") || text.includes("Exception")) {
        penyebab = "ADA SALAH KETIK DI KODE Code.gs.";
      } else if (text.includes("504") || text.includes("Timeout")) {
        penyebab = "Google Script MASIH lambat (Kemungkinan Vercel membaca Versi Lama).";
      }
      
      // Ambil 50 huruf pertama dari HTML untuk bukti
      const snippet = text.substring(0, 50).replace(/\n/g, '');
      
      return Response.json(
        { success: false, error: `DETEKTIF BACA HTML: ${penyebab} | Isi asli: ${snippet}...` },
        { status: 502 }
      );
    }
  } catch (err) {
    return Response.json(
      { success: false, error: 'Gagal menghubungi backend: ' + err.message },
      { status: 502 }
    );
  }
}
