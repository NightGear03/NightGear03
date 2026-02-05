const { GoogleSpreadsheet } = require('google-spreadsheet');

export default async function handler(req, res) {
  const SHEET_ID = process.env.SHEET_ID;
  const GOOGLE_EMAIL = process.env.GOOGLE_EMAIL;
  const GOOGLE_KEY = process.env.GOOGLE_KEY;

  // Mengambil parameter "sheet" dari URL, contoh: /api/data?sheet=Users
  const targetSheet = req.query.sheet || 'Files'; 

  const doc = new GoogleSpreadsheet(SHEET_ID);

  try {
    await doc.useServiceAccountAuth({
      client_email: GOOGLE_EMAIL,
      private_key: GOOGLE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[targetSheet]; 

    if (!sheet) {
      return res.status(404).json({ error: `Tab '${targetSheet}' tidak ditemukan!` });
    }

    const rows = await sheet.getRows();
    
    // Ambil semua kolom yang ada di baris tersebut secara dinamis
    const data = rows.map(row => {
      const obj = {};
      sheet.headerValues.forEach(header => {
        obj[header] = row[header] || '';
      });
      return obj;
    });

    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
