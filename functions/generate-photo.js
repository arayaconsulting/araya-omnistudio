exports.handler = async (event, context) => {
  // Hanya izinkan metode POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Membaca API Key yang sudah Anda simpan di Netlify
    const apiKey = process.env.PHOTOROOM_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Kunci API Photoroom belum terbaca di Netlify.' }),
      };
    }

    // Mengambil data binary mentah dari body yang dikirim oleh tools.html
    const isBase64 = event.isBase64Encoded;
    const requestBody = isBase64 ? Buffer.from(event.body, 'base64') : Buffer.from(event.body);

    // Mencari boundary text dari header untuk memisahkan data form
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    const boundary = contentType.split('boundary=')[1];
    
    if (!boundary) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Format pengiriman data tidak valid.' }),
      };
    }

    // Meneruskan seluruh data form-data mentah langsung ke API Photoroom
    const response = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: requestBody
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Ditolak Photoroom (${response.status}): ${errorText}` }),
      };
    }

    // Konversi hasil gambar dari Photoroom menjadi base64 string untuk dikirim kembali ke frontend
    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: `data:image/png;base64,${base64Image}`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Terjadi kesalahan internal server: ' + error.message }),
    };
  }
};
