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

    // Mengambil data dari frontend (tools.html)
    const body = JSON.parse(event.body);

    // Kirim data ke API Photoroom resmi menggunakan native fetch (lebih stabil untuk data besar)
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
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Ditolak Photoroom (${response.status}): ${errorText}` }),
      };
    }

    // Ambil hasil gambar dan ubah ke format Buffer secara aman
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
