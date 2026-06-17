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
    const apiKey = process.env.PHOTOROOM_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Kunci API Photoroom belum diatur di Netlify.' }),
      };
    }

    // Mengambil data yang dikirim dari frontend (tools.html)
    const body = JSON.parse(event.body);

    // Kirim data ke API Photoroom
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
        padding: body.padding || 0.1,
        format: 'png',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: errorData.message || 'Gagal memproses gambar di Photoroom.' }),
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
