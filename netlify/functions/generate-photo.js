exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const base64Image = body.image.split(',')[1];
    const theme = body.theme;
    const lighting = body.lighting;
    const category = body.category;

    // 1. Rangkai instruksi otomatis untuk latar belakang foto
    let promptVisual = `commercial product photography, professional studio background setup, ${theme} texture element, ${lighting} lighting focus, high resolution, realistic depth of field and ambient shadows`;

    // Hubungkan langsung ke server AI Photoroom
    const photoResponse = await fetch('https://image-api.photoroom.com/v2/backgrounds', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.PHOTOROOM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "imageUrl": `data:image/jpeg;base64,${base64Image}`,
        "prompt": promptVisual
      })
    });

    if (!photoResponse.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: "Gagal memproses gambar di AI Studio." }) };
    }
    const arrayBuffer = await photoResponse.arrayBuffer();
    const base64ResultImg = Buffer.from(arrayBuffer).toString('base64');

    // 2. Buat Teks Iklan Otomatis Berbobot Tanpa User Capek Mengetik
    let textSoft = "";
    let textHard = "";

    if (category === "kuliner") {
      textSoft = "Ada cerita dan dedikasi di balik setiap cita rasa hangat yang tersaji hari ini. Pemilihan bahan baku lokal yang segar dipadukan dengan takaran resep yang pas menghasilkan kenyamanan rasa sejati.\n\nSudahkah Anda memberikan apresiasi terbaik untuk diri sendiri hari ini?";
      textHard = "🔥 PROMO KHUSUS HARI INI! 🔥\n\nManjakan lidah Anda dengan menu kuliner andalan kami, kini hadir dengan penawaran spesial potongan harga hemat 20% langsung di outlet! Rasa premium, harga bersahabat.\n\nYuk, klik link di bio atau kunjungi kami sekarang juga sebelum kehabisan stok harian!";
    } else if (category === "fashion") {
      textSoft = "Kenyamanan sejati bermula dari benang material pilihan yang mampu mengerti ritme gerak tubuh Anda sepanjang hari. Sentuhan cutting minimalis dirancang khusus untuk memperkuat karakter penampilan tanpa terkesan berlebihan.\n\nSederhana, berkelas, dan percaya diri.";
      textHard = "✨ KOLEKSI TERBARU RESMI DIRILIS! ✨\n\nTingkatkan standar gaya harian Anda dengan koleksi terbatas dari kami. Diproduksi secara eksklusif demi menjaga kualitas jahitan tetap sempurna di setiap sisinya.\n\nAmankan ukuran favorit Anda sekarang juga, ketuk link di bio untuk order instan!";
    } else if (category === "skincare") {
      textSoft = "Menjaga nutrisi kulit tetap seimbang adalah komitmen jangka panjang demi merawat aset terbaik diri Anda. Formula ringan yang menghidrasi secara mendalam, menemani setiap langkah percaya diri Anda menghadapi hari.\n\nSehat alami, terpancar nyata.";
      textHard = "🛍️ GLOWING MAKSIMAL DENGAN HARGA SPESIAL! 🛍️\n\nDapatkan paket bundling perawatan kulit eksklusif hari ini dengan bonus potongan harga dan gratis ongkos kirim ke seluruh wilayah. Produk terjamin aman dan bersertifikasi resmi.\n\nHubungi admin kami sekarang, klik tombol pesan sekarang juga!";
    } else {
      textSoft = "Kualitas terbaik lahir dari konsistensi penuh untuk mempermudah dan mendukung kelancaran rutinitas harian Anda. Setiap detail produk dirancang secara teliti agar memberikan manfaat yang fungsional dan tahan lama.";
      textHard = "📢 JANGAN LEWATKAN KESEMPATAN INI! 📢\n\nMiliki produk andalan dengan jaminan kualitas terbaik langsung dari pusatnya. Dapatkan penawaran harga terbaik khusus pemesanan minggu ini.\n\nKonsultasi gratis dan pemesanan instan, silakan hubungi tim CS kami hari ini!";
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        image: `data:image/jpeg;base64,${base64ResultImg}`,
        captionSoft: textSoft,
        captionHard: textHard
      })
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
