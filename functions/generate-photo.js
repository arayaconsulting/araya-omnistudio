const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Hanya izinkan metode POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Membaca API Key dengan toleransi variasi nama variabel di Netlify
    const apiKey = process.env.PHOTOROOM_API_KEY || process.env.photoroom_api_key || process.env.ApiKey;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Kunci API Photoroom belum terbaca di Netlify.' }),
      };
    }

    // Mengambil data yang dikirim dari frontend (tools.html)
    const body = JSON.parse(event.body);

    // Kirim data ke API Photoroom resmi
    const response = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: body.imageUrl,
        background: {
          prompt: body.backgroundPrompt || 'clean studio background',
        },
        padding: body.padding || 0.15,
        format: 'png',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: errorData.message || 'Ditolak oleh Photoroom. Pastikan API Key aktif.' }),
      };
    }

    // Ambil hasil gambar dalam bentuk buffer/binary
    const imageBuffer = await response.buffer();
    const base64Image = imageBuffer.toString('base64');

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
