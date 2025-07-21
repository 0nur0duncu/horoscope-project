class BurcAPI {
  constructor() {
    this.baseURL = window.location.origin;
    this.selectedSign = null;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Burç seçimi
    document.querySelectorAll(".zodiac-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        this.selectZodiacSign(e.currentTarget);
      });
    });

    // Seçenek butonları
    document.querySelectorAll(".option-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.handleOptionClick(e.currentTarget);
      });
    });
  }

  selectZodiacSign(card) {
    // Önceki seçimi temizle
    document.querySelectorAll(".zodiac-card").forEach((c) => {
      c.classList.remove("active");
    });

    // Yeni seçimi işaretle
    card.classList.add("active");
    this.selectedSign = card.dataset.sign;

    // Seçenekler bölümünü göster
    const optionsSection = document.getElementById("optionsSection");
    optionsSection.style.display = "block";
    optionsSection.scrollIntoView({ behavior: "smooth" });
  }

  async handleOptionClick(button) {
    if (!this.selectedSign) {
      alert("Lütfen önce bir burç seçin!");
      return;
    }

    const type = button.dataset.type;
    const value = button.dataset.value;

    // Sonuçlar bölümünü göster
    this.showResultsSection();

    // Loading göster
    this.showLoading();

    try {
      let data;
      switch (type) {
        case "time":
          data = await this.fetchTimeBasedComment(this.selectedSign, value);
          break;
        case "category":
          data = await this.fetchCategoryComment(this.selectedSign, value);
          break;
        case "gemini":
          data = await this.fetchGeminiComment(this.selectedSign, value);
          break;
      }

      this.displayResults(data, type, value);
    } catch (error) {
      this.displayError(error.message);
    }
  }

  async fetchTimeBasedComment(sign, time) {
    const url =
      time === "gunluk"
        ? `${this.baseURL}/get/${sign}`
        : `${this.baseURL}/get/${sign}/${time}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  async fetchCategoryComment(sign, category) {
    const url = `${this.baseURL}/gets/${sign}/${category}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  async fetchGeminiComment(sign, time) {
    const url =
      time === "gunluk"
        ? `${this.baseURL}/gemini/${sign}`
        : `${this.baseURL}/gemini/${sign}/${time}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  showResultsSection() {
    document.getElementById("resultsSection").style.display = "block";
    document
      .getElementById("resultsSection")
      .scrollIntoView({ behavior: "smooth" });

    const signName = this.getSignDisplayName(this.selectedSign);
    document.getElementById(
      "resultsTitle"
    ).textContent = `${signName} Burcu Yorumu`;
  }

  showLoading() {
    document.getElementById("loading").style.display = "block";
    document.getElementById("resultsContent").innerHTML = "";
  }

  hideLoading() {
    document.getElementById("loading").style.display = "none";
  }

  displayResults(data, type, value) {
    this.hideLoading();

    const resultsContent = document.getElementById("resultsContent");
    let html = "";

    if (type === "gemini") {
      html = this.formatGeminiResult(data);
    } else if (type === "category") {
      html = this.formatCategoryResult(data);
    } else {
      html = this.formatTimeBasedResult(data, value);
    }

    resultsContent.innerHTML = html;
    resultsContent.classList.add("fade-in");
  }

  formatTimeBasedResult(data, timeType) {
    let html = "";

    if (data.hurriyet && data.hurriyet.GunlukYorum) {
      html += this.createResultCard(
        "Hürriyet - Günlük Yorum",
        data.hurriyet.GunlukYorum,
        "fas fa-newspaper",
        data.hurriyet
      );
    }

    if (data.hurriyet && data.hurriyet.Yorum) {
      html += this.createResultCard(
        `Hürriyet - ${this.getTimeDisplayName(timeType)} Yorum`,
        data.hurriyet.Yorum,
        "fas fa-newspaper",
        data.hurriyet
      );
    }

    if (data.mynet && data.mynet.GunlukYorum) {
      html += this.createResultCard(
        "Mynet - Günlük Yorum",
        data.mynet.GunlukYorum,
        "fas fa-globe",
        data.mynet
      );
    }

    if (data.mynet && data.mynet.Yorum) {
      html += this.createResultCard(
        `Mynet - ${this.getTimeDisplayName(timeType)} Yorum`,
        data.mynet.Yorum,
        "fas fa-globe",
        data.mynet
      );
    }

    if (data.gemini && data.gemini.GeminiYorum) {
      html += this.createGeminiCard(
        "Gemini AI Analizi",
        data.gemini.GeminiYorum,
        data.gemini
      );
    }

    return (
      html ||
      '<div class="error-card"><h3>Veri bulunamadı</h3><p>Bu burç için veri alınamadı.</p></div>'
    );
  }

  formatCategoryResult(data) {
    if (data.hurriyet && data.hurriyet.length > 0) {
      const result = data.hurriyet[0];
      return this.createResultCard(
        `${result.Ozellik} - Hürriyet`,
        result.Yorum,
        "fas fa-tags",
        result
      );
    }

    return '<div class="error-card"><h3>Veri bulunamadı</h3><p>Bu kategori için veri alınamadı.</p></div>';
  }

  formatGeminiResult(data) {
    return this.createGeminiCard("Gemini AI Yorumu", data.GeminiYorum, data);
  }

  createResultCard(title, content, icon, metadata = {}) {
    const metaHtml = this.createMetaItems(metadata);

    return `
            <div class="result-card">
                <h3><i class="${icon}"></i> ${title} <span class="source">(Kaynak: Web Scraping)</span></h3>
                <div class="result-content">${content}</div>
                ${metaHtml}
            </div>
        `;
  }

  createGeminiCard(title, content, metadata = {}) {
    const metaHtml = this.createMetaItems(metadata);

    return `
            <div class="result-card gemini-card">
                <h3><i class="fas fa-robot"></i> ${title} <span class="source">(Kaynak: Gemini AI)</span></h3>
                <div class="result-content">${content}</div>
                ${metaHtml}
            </div>
        `;
  }

  createMetaItems(metadata) {
    let metaItems = [];

    if (metadata.Mottosu) {
      metaItems.push(
        `<span class="meta-item">Motto: ${metadata.Mottosu}</span>`
      );
    }
    if (metadata.Gezegeni) {
      metaItems.push(
        `<span class="meta-item">Gezegen: ${metadata.Gezegeni}</span>`
      );
    }
    if (metadata.Elementi) {
      metaItems.push(
        `<span class="meta-item">Element: ${metadata.Elementi}</span>`
      );
    }
    if (metadata.OlusturulmaZamani) {
      const date = new Date(metadata.OlusturulmaZamani).toLocaleDateString(
        "tr-TR"
      );
      metaItems.push(`<span class="meta-item">Oluşturulma: ${date}</span>`);
    }

    return metaItems.length > 0
      ? `<div class="result-meta">${metaItems.join("")}</div>`
      : "";
  }

  displayError(message) {
    this.hideLoading();

    const resultsContent = document.getElementById("resultsContent");
    resultsContent.innerHTML = `
            <div class="result-card error-card">
                <h3><i class="fas fa-exclamation-triangle"></i> Hata</h3>
                <div class="result-content">Bir hata oluştu: ${message}</div>
            </div>
        `;
  }

  getSignDisplayName(sign) {
    const signs = {
      koc: "Koç",
      boga: "Boğa",
      ikizler: "İkizler",
      yengec: "Yengeç",
      aslan: "Aslan",
      basak: "Başak",
      terazi: "Terazi",
      akrep: "Akrep",
      yay: "Yay",
      oglak: "Oğlak",
      kova: "Kova",
      balik: "Balık",
    };
    return signs[sign] || sign;
  }

  getTimeDisplayName(time) {
    const times = {
      gunluk: "Günlük",
      haftalik: "Haftalık",
      aylik: "Aylık",
      yillik: "Yıllık",
    };
    return times[time] || time;
  }
}

// Global functions
function goBack() {
  document.getElementById("resultsSection").style.display = "none";
  document
    .getElementById("optionsSection")
    .scrollIntoView({ behavior: "smooth" });
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  new BurcAPI();
});

// Service Worker for PWA (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
