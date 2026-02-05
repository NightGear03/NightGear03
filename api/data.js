const { GoogleSpreadsheet } = require('google-spreadsheet');

export default async function handler(req, res) {
  // Mengambil data dari Environment Variables di Vercel
  const SHEET_ID = process.env.SHEET_ID;
  const GOOGLE_EMAIL = process.env.GOOGLE_EMAIL;
  const GOOGLE_KEY = process.env.GOOGLE_KEY;

  const doc = new GoogleSpreadsheet(SHEET_ID);

  try {
    // Autentikasi ke Google Sheets
    await doc.useServiceAccountAuth({
      client_email: GOOGLE_EMAIL,
      // Memperbaiki format private key agar terbaca benar oleh server
      private_key: GOOGLE_KEY.replace(/\\n/g, '\n'),
    });

    // Memuat informasi spreadsheet
    await doc.loadInfo();
    
    // MENGAMBIL TAB KHUSUS BERNAMA 'Files'
    const sheet = doc.sheetsByTitle['Files']; 

    if (!sheet) {
      return res.status(404).json({ 
        error: "Tab bernama 'Files' tidak ditemukan! Pastikan nama tab di Google Sheets sesuai." 
      });
    }

    // Mengambil semua baris data
    const rows = await sheet.getRows();

    // Memetakan data dari baris Sheet ke format JSON yang dimengerti Frontend
    const data = rows.map(row => ({
      id: row.id || '',
      category: row.category || '',
      subcategory: row.subcategory || '',
      name: row.name || '',
      type: row.type || 'free',
      code: row.code || '',
      status: row.status || 'stable',
      download_url: row.download_url || '#',
      description: row.description || ''
    }));

    // Memberikan header agar browser tidak cache data terlalu lama
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
    
    // Kirim data ke Frontend
    return res.status(200).json(data);

  } catch (error) {
    console.error("Error API Data:", error);
    return res.status(500).json({ 
      error: "Gagal menyambung ke Google Sheets", 
      details: error.message 
    });
  }
}
