require("dotenv").config();
const cheerio = require("cheerio");
const express = require("express");
const fetch = require("node-fetch");
const slugify = require("slugify");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");

// Initialize Gemini AI with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Hürriyet API URLs
API_URI_1 = "https://www.hurriyet.com.tr/mahmure/astroloji/{0}-burcu/"; //burada günlük yorumları
API_URI_2 =
  "https://www.hurriyet.com.tr/mahmure/astroloji/{0}-burcu-{1}-yorum/"; // burada get değerine göre burcun haftalık,aylık,yıllık yorumunu alacağız
API_URI_3 =
  "https://www.hurriyet.com.tr/mahmure/astroloji/burclar/{0}-burcu/{1}";
// gelecek degerler => AŞK,KARİYER,OLUMLU YONLER,SAĞLIK,STİL,ÜNLÜLER,DİYET,ZIT BURÇLARI,EĞLENCE HAYATİ, MAKYAJ, SAÇ STİLİ, ŞİFALI BİTKİLER, FİLM ÖNERİLERİ, ÇOCUKLUĞU, KADINI, ERKEĞİ

// Mynet API URLs
MYNET_DAILY =
  "https://www.mynet.com/kadin/burclar-astroloji/{0}-burcu-gunluk-yorumu.html";
MYNET_WEEKLY =
  "https://www.mynet.com/kadin/burclar-astroloji/{0}-burcu-haftalik-yorumu.html";
MYNET_MONTHLY =
  "https://www.mynet.com/kadin/burclar-astroloji/{0}-burcu-aylik-yorumu.html";
MYNET_YEARLY =
  "https://www.mynet.com/kadin/burclar-astroloji/{0}-burcu-yillik-yorumu.html";

const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Root route serves the HTML interface
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Cache system
const cache = new Map();

// Cache duration in milliseconds
const CACHE_DURATIONS = {
  gunluk: 24 * 60 * 60 * 1000, // 24 hours
  haftalik: 7 * 24 * 60 * 60 * 1000, // 7 days
  aylik: 30 * 24 * 60 * 60 * 1000, // 30 days
  yillik: 365 * 24 * 60 * 60 * 1000, // 365 days
  gemini: 24 * 60 * 60 * 1000, // Cache Gemini responses for 24 hours
};

// Cache helper functions
function getCacheKey(source, burc, type = "gunluk", ozellik = null) {
  return `${source}_${burc}_${type}${ozellik ? "_" + ozellik : ""}`;
}

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiry) {
    // console.log(`Cache hit for: ${key}`);
    return cached.data;
  }
  if (cached) {
    cache.delete(key);
    // console.log(`Cache expired for: ${key}`);
  }
  return null;
}

function setCachedData(key, data, duration) {
  cache.set(key, {
    data: data,
    expiry: Date.now() + duration,
  });
  // console.log(`Cache set for: ${key}, expires in: ${duration / 1000 / 60} minutes`);
}

// Helper function to fetch Hürriyet daily data
async function fetchHurriyetDaily(burc) {
  const cacheKey = getCacheKey("hurriyet", burc, "gunluk");
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(API_URI_1.replace("{0}", slugify(burc)));
    const body = await response.text();
    const $ = cheerio.load(body);

    let data = null;
    $("div[class=main-wrapper]").each(function (i, e) {
      data = {
        Burc: burc.charAt(0).toUpperCase() + burc.slice(1),
        Mottosu:
          $(this)
            .find(
              "div[class=page] div div .region-type-1.col-12 .row.mb20 div div div[class=horoscope-menu-detail] ul li "
            )
            .slice(0)
            .eq(0)
            .text()
            .match(/(.*):\s\s(.*)/)?.[2] || "",
        Gezegeni:
          $(this)
            .find(
              "div[class=page] div div .region-type-1.col-12 .row.mb20 div div div[class=horoscope-menu-detail] ul li "
            )
            .slice(0)
            .eq(1)
            .text()
            .match(/(.*):\s\s(.*)/)?.[2] || "",
        Elementi:
          $(this)
            .find(
              "div[class=page] div div .region-type-1.col-12 .row.mb20 div div div[class=horoscope-menu-detail] ul li "
            )
            .slice(0)
            .eq(2)
            .text()
            .match(/(.*):\s\s(.*)/)?.[2] || "",
        GunlukYorum: $(this)
          .find(
            "div[class=page] div div .region-type-2.col-lg-8.col-md-12 div div div[class=horoscope-detail-content] div p"
          )
          .text(),
      };
    });

    if (data) {
      setCachedData(cacheKey, data, CACHE_DURATIONS.gunluk);
    }

    return data;
  } catch (error) {
    // console.error("Hürriyet daily fetch error:", error);
    return null;
  }
}

// Helper function to fetch Mynet daily data
async function fetchMynetDaily(burc) {
  const cacheKey = getCacheKey("mynet", burc, "gunluk");
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(MYNET_DAILY.replace("{0}", slugify(burc)));
    const body = await response.text();
    const $ = cheerio.load(body);

    // console.log("Mynet URL:", MYNET_DAILY.replace('{0}', slugify(burc)));
    // console.log("Mynet Status:", response.status);

    // Try multiple selectors to find the content
    let yorum = "";

    // Try the original selectors first
    yorum = $(
      "body > div:nth-child(13) > div > div:nth-child(1) > div:nth-child(4) > div > p"
    )
      .text()
      .trim();

    if (!yorum) {
      yorum = $(
        "body > div:nth-child(15) > div > div:nth-child(1) > div:nth-child(4) > div > p"
      )
        .text()
        .trim();
    }

    // Try alternative selectors
    if (!yorum) {
      yorum = $(".content-detail p").text().trim();
    }

    if (!yorum) {
      yorum = $(".detail-content p").text().trim();
    }

    if (!yorum) {
      yorum = $('div[class*="content"] p').first().text().trim();
    }

    if (!yorum) {
      yorum = $("p")
        .filter(function () {
          return $(this).text().length > 50;
        })
        .first()
        .text()
        .trim();
    }

    // console.log("Mynet yorum found:", yorum ? "Yes" : "No", yorum.substring(0, 100));

    const data = {
      Burc: burc.charAt(0).toUpperCase() + burc.slice(1),
      GunlukYorum: yorum || "İçerik bulunamadı",
    };

    setCachedData(cacheKey, data, CACHE_DURATIONS.gunluk);
    return data;
  } catch (error) {
    // console.error("Mynet daily fetch error:", error);
    const errorData = {
      Burc: burc.charAt(0).toUpperCase() + burc.slice(1),
      GunlukYorum: "Hata: " + error.message,
    };
    return errorData;
  }
}

// Helper function to fetch Hürriyet timed data (haftalık, aylık, yıllık)
async function fetchHurriyetTimed(burc, zaman) {
  const cacheKey = getCacheKey("hurriyet", burc, zaman);
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(
      API_URI_2.replace("{0}", slugify(burc)).replace("{1}", slugify(zaman))
    );
    const body = await response.text();
    const $ = cheerio.load(body);

    let data = null;
    $("div[class=main-wrapper]").each(function (i, e) {
      data = {
        Burc: burc.charAt(0).toUpperCase() + burc.slice(1),
        Zaman: zaman.charAt(0).toUpperCase() + zaman.slice(1),
        Mottosu:
          $(this)
            .find(
              "div[class=page] div div .region-type-1.col-12 .row.mb20 div div div[class=horoscope-menu-detail] ul li "
            )
            .slice(0)
            .eq(0)
            .text()
            .match(/(.*):\s\s(.*)/)?.[2] || "",
        Gezegeni:
          $(this)
            .find(
              "div[class=page] div div .region-type-1.col-12 .row.mb20 div div div[class=horoscope-menu-detail] ul li "
            )
            .slice(0)
            .eq(1)
            .text()
            .match(/(.*):\s\s(.*)/)?.[2] || "",
        Elementi:
          $(this)
            .find(
              "div[class=page] div div .region-type-1.col-12 .row.mb20 div div div[class=horoscope-menu-detail] ul li "
            )
            .slice(0)
            .eq(2)
            .text()
            .match(/(.*):\s\s(.*)/)?.[2] || "",
        Yorum: $(this)
          .find(
            "div[class=page] div div .region-type-2.col-lg-8.col-md-12 div div div[class=horoscope-detail-content] div p"
          )
          .text(),
      };
    });

    if (data) {
      const duration =
        CACHE_DURATIONS[zaman.toLowerCase()] || CACHE_DURATIONS.gunluk;
      setCachedData(cacheKey, data, duration);
    }

    return data;
  } catch (error) {
    // console.error("Hürriyet timed fetch error:", error);
    return null;
  }
}

// Helper function to fetch Mynet timed data
async function fetchMynetTimed(burc, zaman) {
  const cacheKey = getCacheKey("mynet", burc, zaman);
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    let url;
    switch (zaman.toLowerCase()) {
      case "haftalik":
        url = MYNET_WEEKLY;
        break;
      case "aylik":
        url = MYNET_MONTHLY;
        break;
      case "yillik":
        url = MYNET_YEARLY;
        break;
      default:
        return null;
    }

    const response = await fetch(url.replace("{0}", slugify(burc)));
    const body = await response.text();
    const $ = cheerio.load(body);

    // console.log("Mynet timed URL:", url.replace('{0}', slugify(burc)));
    // console.log("Mynet timed Status:", response.status);

    // Try multiple selectors to find the content
    let yorum = "";

    // Try the original selectors first
    yorum = $(
      "body > div:nth-child(13) > div > div:nth-child(1) > div:nth-child(4) > div > p"
    )
      .text()
      .trim();

    if (!yorum) {
      yorum = $(
        "body > div:nth-child(15) > div > div:nth-child(1) > div:nth-child(4) > div > p"
      )
        .text()
        .trim();
    }

    // Try alternative selectors
    if (!yorum) {
      yorum = $(".content-detail p").text().trim();
    }

    if (!yorum) {
      yorum = $(".detail-content p").text().trim();
    }

    if (!yorum) {
      yorum = $('div[class*="content"] p').first().text().trim();
    }

    if (!yorum) {
      yorum = $("p")
        .filter(function () {
          return $(this).text().length > 50;
        })
        .first()
        .text()
        .trim();
    }

    // console.log("Mynet timed yorum found:", yorum ? "Yes" : "No", yorum.substring(0, 100));

    const data = {
      Burc: burc.charAt(0).toUpperCase() + burc.slice(1),
      Zaman: zaman.charAt(0).toUpperCase() + zaman.slice(1),
      Yorum: yorum || "İçerik bulunamadı",
    };

    const duration =
      CACHE_DURATIONS[zaman.toLowerCase()] || CACHE_DURATIONS.gunluk;
    setCachedData(cacheKey, data, duration);
    return data;
  } catch (error) {
    // console.error("Mynet timed fetch error:", error);
    const errorData = {
      Burc: burc.charAt(0).toUpperCase() + burc.slice(1),
      Zaman: zaman.charAt(0).toUpperCase() + zaman.slice(1),
      Yorum: "Hata: " + error.message,
    };
    return errorData;
  }
}

//Gemini AI helper function
async function generateGeminiInterpretation(
  burc,
  hurriyetData,
  mynetData,
  zaman = "gunluk"
) {
  const cacheKey = getCacheKey("gemini", burc, zaman);
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = `Sen profesyonel bir astrolog ve burç yorumcususun. Aşağıdaki ${burc} burcuna ait ${zaman} verilerini analiz ederek, özgün ve kişiselleştirilmiş bir yorum üret:

Hürriyet Verisi:
${hurriyetData ? JSON.stringify(hurriyetData, null, 2) : "Veri bulunamadı"}

Mynet Verisi:
${mynetData ? JSON.stringify(mynetData, null, 2) : "Veri bulunamadı"}

Lütfen bu verileri birleştirerek:
1. Genel durum değerlendirmesi
2. Aşk ve ilişkiler
3. Kariyer ve para
4. Sağlık
5. Günün/dönemin önerisi

konularında kapsamlı, pozitif ve motive edici bir yorum üret. Yorum Türkçe olsun ve ${burc} burcundaki kişilere hitap etsin.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const interpretation = response.text();

    const geminiData = {
      Burc: burc.charAt(0).toUpperCase() + burc.slice(1),
      Zaman: zaman.charAt(0).toUpperCase() + zaman.slice(1),
      GeminiYorum: interpretation,
      OlusturulmaZamani: new Date().toISOString(),
    };

    setCachedData(cacheKey, geminiData, CACHE_DURATIONS.gemini);
    return geminiData;
  } catch (error) {
    console.error("Gemini AI error:", error);
    return {
      Burc: burc.charAt(0).toUpperCase() + burc.slice(1),
      Zaman: zaman.charAt(0).toUpperCase() + zaman.slice(1),
      GeminiYorum:
        "Gemini AI yorumu şuan için oluşturulamadı. Lütfen daha sonra tekrar deneyin.",
      Hata: error.message,
    };
  }
}

//Gunluk /get/burc
app.get("/get/:burc", async (req, res) => {
  var burc = req.params.burc;

  const [hurriyetData, mynetData] = await Promise.all([
    fetchHurriyetDaily(burc),
    fetchMynetDaily(burc),
  ]);

  // Generate Gemini interpretation
  const geminiData = await generateGeminiInterpretation(
    burc,
    hurriyetData,
    mynetData,
    "gunluk"
  );

  const response = {
    hurriyet: hurriyetData,
    mynet: mynetData,
    gemini: geminiData,
  };

  res.send(response);
});

//haftalik,aylik,yillik burc yorumları örnek olarak => .../get/aslan/haftalik
//gunluk yorum için herhangi bir değere gerek yoktur => /get/burc yeterlidir
app.get("/get/:burc/:zaman", async (req, res) => {
  var burc = req.params.burc;
  var zaman = req.params.zaman;

  const [hurriyetData, mynetData] = await Promise.all([
    fetchHurriyetTimed(burc, zaman),
    fetchMynetTimed(burc, zaman),
  ]);

  // Generate Gemini interpretation
  const geminiData = await generateGeminiInterpretation(
    burc,
    hurriyetData,
    mynetData,
    zaman
  );

  const response = {
    hurriyet: hurriyetData,
    mynet: mynetData,
    gemini: geminiData,
  };

  res.send(response);
});

// Only Gemini interpretation endpoint
app.get("/gemini/:burc", async (req, res) => {
  var burc = req.params.burc;

  const [hurriyetData, mynetData] = await Promise.all([
    fetchHurriyetDaily(burc),
    fetchMynetDaily(burc),
  ]);

  const geminiData = await generateGeminiInterpretation(
    burc,
    hurriyetData,
    mynetData,
    "gunluk"
  );

  res.send(geminiData);
});

// Only Gemini interpretation endpoint with time period
app.get("/gemini/:burc/:zaman", async (req, res) => {
  var burc = req.params.burc;
  var zaman = req.params.zaman;

  const [hurriyetData, mynetData] = await Promise.all([
    fetchHurriyetTimed(burc, zaman),
    fetchMynetTimed(burc, zaman),
  ]);

  const geminiData = await generateGeminiInterpretation(
    burc,
    hurriyetData,
    mynetData,
    zaman
  );

  res.send(geminiData);
});

// Özeliklere Göre
// /gets/burc/ozellik => Dikkat etmemiz gereken nokta burada GET değil GETS kullandık
// gelecek degerler => AŞK,KARİYER,OLUMLU YONLER,SAĞLIK,STİL,ÜNLÜLER,DİYET,ZIT BURÇLARI,EĞLENCE HAYATİ, MAKYAJ, SAÇ STİLİ, ŞİFALI BİTKİLERi, FİLM ÖNERİLERİ, ÇOCUKLUĞU, KADINI, ERKEĞİ
app.get("/gets/:burc/:ozellik", async (req, res) => {
  var burc = req.params.burc;
  var ozellik = req.params.ozellik;

  const cacheKey = getCacheKey("hurriyet", burc, "ozellik", ozellik);
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return res.send({ hurriyet: cachedData });
  }

  var datas = [];

  try {
    const response = await fetch(
      API_URI_3.replace("{0}", slugify(burc)).replace("{1}", slugify(ozellik))
    );
    const body = await response.text();

    const $ = cheerio.load(body);

    $(".col-md-12.col-lg-8").each(function (i, e) {
      datas[i] = {
        Burc: burc.charAt(0).toUpperCase() + burc.slice(1),
        Ozellik: ozellik.charAt(0).toUpperCase() + ozellik.slice(1),
        Yorum: $(this)
          .find(".news-content.readingTime p")
          .map(function () {
            return $(this).text();
          })
          .get()
          .join(" "),
      };
    });

    if (datas.length > 0) {
      setCachedData(cacheKey, datas, CACHE_DURATIONS.haftalik); // Cache for 7 days
    }
  } catch (error) {
    // console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.send({ hurriyet: datas });
});

// Cache status endpoint for debugging
app.get("/cache/status", (req, res) => {
  const cacheStatus = {
    totalEntries: cache.size,
    entries: [],
  };

  for (const [key, value] of cache.entries()) {
    const isGemini = key.includes("gemini");
    cacheStatus.entries.push({
      key: key,
      type: isGemini ? "Gemini AI" : "Scraped Data",
      expiresIn:
        Math.max(0, Math.round((value.expiry - Date.now()) / 1000 / 60)) +
        " minutes",
    });
  }

  res.json(cacheStatus);
});

// Clear cache endpoint
app.delete("/cache/clear", (req, res) => {
  cache.clear();
  res.json({ message: "Cache cleared successfully" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log("Server is running on port " + port);
});
