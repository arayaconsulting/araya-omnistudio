exports.handler = async (event, context) => {
  // Hanya izinkan metode POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Membaca API Key Photoroom dari Netlify
    const apiKey = process.env.PHOTOROOM_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Kunci API Photoroom belum terbaca di Netlify.' }),
      };
    }

    // Mengambil data JSON dari frontend
    const body = JSON.parse(event.body);
    if (!body.image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Data gambar tidak ditemukan.' }),
      };
    }

    // Mengirimkan request ke Photoroom dengan format JSON resmi sesuai dokumentasi Photoroom
    const response = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: body.image, // Mengirim string base64 data URI langsung
        background: {
          prompt: body.backgroundPrompt || 'clean studio background',
        },
        padding: 0.15,
        format: 'png'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Ditolak Photoroom (${response.status}): ${errorText}` }),
      };
    }

    // Mengonversi hasil gambar binary dari Photoroom kembali ke Base64 untuk frontend
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
