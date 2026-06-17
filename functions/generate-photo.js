exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const apiKey = process.env.PHOTOROOM_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'API Key belum terbaca di Netlify.' }) };
    }

    // Membaca data json yang dikirim dari tools.html
    const body = JSON.parse(event.body);
    
    // Membersihkan header Base64 jika ada agar hanya tersisa teks murni gambarnya
    const base64Data = body.image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Membuat objek FormData standar untuk dikirim ke API Photoroom resmi
    const formData = new FormData();
    formData.append('imageFile', new Blob([imageBuffer], { type: 'image/png' }), 'image.png');
    formData.append('background.prompt', body.backgroundPrompt || 'clean studio background');
    formData.append('padding', '0.15');

    const response = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Ditolak Photoroom (${response.status}): ${errorText}` }),
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const resultBase64 = Buffer.from(arrayBuffer).toString('base64');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: `data:image/png;base64,${resultBase64}` }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
