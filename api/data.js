const { GoogleSpreadsheet } = require('google-spreadsheet');

export default async function handler(req, res) {
  const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

  try {
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_EMAIL,
      private_key: process.env.GOOGLE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    
    // Mengambil data dari sheet pertama (index 0)
    const sheet = doc.sheetsByIndex[0]; 
    const rows = await sheet.getRows();

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

    // Cache header agar tidak terlalu sering hit API Google (opsional)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
