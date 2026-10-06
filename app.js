// ==========================================
// GÜVENLİ GİRİŞ SİSTEMİ (SUPABASE AUTH)
// ==========================================

window.onload = async function() {
    try {
        const { data: { session }, error } = await window.sb.auth.getSession();
        if (error) throw error;
        
        if (session) {
            basariylaGirisYapildi();
        } else {
            const el = document.getElementById('login-email');
            if (el) el.focus();
        }
    } catch (err) { console.error("GIRIS HATASI DETAYI:", err); console.log("URL Kontrol:", typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : "YOK");
        
    }
};

async function sistemeGirisYap() {
    const emailEl = document.getElementById('login-email');
    const sifreEl = document.getElementById('login-password');
    const btn = document.getElementById('btn-login');
    const errBox = document.getElementById('login-error');

    if (!emailEl || !sifreEl) return;

    const email = emailEl.value.trim();
    const sifre = sifreEl.value;

    if (!email || !sifre) {
        errBox.innerText = 'Lütfen e-posta ve şifrenizi eksiksiz girin.';
        errBox.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerText = 'Giriş Yapılıyor...';
    errBox.style.display = 'none';

    try {
        const { error } = await window.sb.auth.signInWithPassword({
            email: email,
            password: sifre,
        });

        if (error) {
            errBox.innerText = 'Giriş Başarısız: ' + (error.message.includes('Invalid') ? 'E-posta veya şifre hatalı' : error.message);
            errBox.style.display = 'block';
            btn.disabled = false;
            btn.innerText = 'Giriş Yap';
        } else {
            basariylaGirisYapildi();
        }
    } catch (err) { console.error("GIRIS HATASI DETAYI:", err); console.log("URL Kontrol:", typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : "YOK");
        errBox.innerText = 'Beklenmeyen bir ağ hatası oluştu.';
        errBox.style.display = 'block';
        btn.disabled = false;
        btn.innerText = 'Giriş Yap';
    }
}

async function basariylaGirisYapildi() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    
    try {
        const { data: { session } } = await window.sb.auth.getSession();
        if(session && session.user && session.user.email) {
            const { data, error } = await window.sb.from('personel_rolleri').select('*').eq('email', session.user.email).single();
            if(data) {
                aktifKullaniciRolu = data.rol;
                aktifKullaniciIsmi = data.isim;
            } else {
                aktifKullaniciRolu = 'avukat';
            }
        }
    } catch(err) { /* Rol bilgisi çekilemediğinde sessizce devam eder (varsayılan: avukat) */ }

    if (aktifKullaniciRolu === 'avukat') {
        const btnEkle = document.getElementById('btn-tebligat-ekle');
        if(btnEkle) btnEkle.style.display = 'none';
        const authBadge = document.getElementById('auth-info-badge');
        if(authBadge) authBadge.style.display = 'none';
        const actionBanner = document.querySelector('.action-banner');
        if(actionBanner) actionBanner.style.display = 'none';
    }

    verileriCek();
}

function cikisYap() {
    window.sb.auth.signOut().then(() => {
        location.reload();
    });
}

// ==========================================
// YARDIMCI FONKSİYONLAR
// ==========================================

function saatiBaslat() {
    function updateClock() {
        const now = new Date();
        const opt = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        const clockEl = document.getElementById('live-clock');
        if (clockEl) clockEl.innerText = now.toLocaleDateString('tr-TR', opt);
    }
    updateClock();
    setInterval(updateClock, 60000);
}

function bugunTarihiniAyarla() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    
    const tebTarihEl = document.getElementById('m-tebligat-tarihi');
    if (tebTarihEl) {
        tebTarihEl.value = today;
        tarihVeyaSureDegisti();
    }
}

function toastGoster(mesaj, tip = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.innerText = mesaj;
    toast.className = 'toast show';
    if (tip === 'error') toast.style.backgroundColor = 'var(--danger-red)';
    else if (tip === 'success') toast.style.backgroundColor = 'var(--success-green)';
    else toast.style.backgroundColor = 'var(--text-main)';

    setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================
// VERİ ÇEKME VE LİSTELEME
// ==========================================

let rawData = null;
let seciliDurum = 'Tümü';
let seciliGun = 7;

async function verileriCek() {
    const loadingEl = document.getElementById('loading');
    const dashboardEl = document.getElementById('dashboard');
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (dashboardEl) dashboardEl.style.display = 'none';

    try {
        const { data, error } = await window.sb.from('tebligatlar')
            .select('*')
            .order('son_tarih', { ascending: true }).limit(5000);

        if (error) throw error;
        rawData = data || [];
        istatistikleriHesaplaVeBas(rawData);
    } catch (err) { console.error("GIRIS HATASI DETAYI:", err); console.log("URL Kontrol:", typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : "YOK");
        if (loadingEl) loadingEl.innerHTML = `<span style="color:var(--danger-red)">Veriler çekilirken hata oluştu: ${err.message}</span>`;
    }
}

function istatistikleriHesaplaVeBas(dataRows) {
    let stats = { toplam: 0, geciken: 0, acil: 0, bekleyen: 0, biten: 0, kontrolEdildi: 0, kontrolBekliyor: 0 };
    let tasks = []; currentTasks = tasks;
    let personelStats = {};
    const bugun = new Date();
    bugun.setHours(0,0,0,0);

    const personeller = new Set();

    dataRows.forEach(row => {
        let durum = "Bekleyen";
        let kalanGunMetni = "";
        let sTarih = row.son_tarih ? new Date(row.son_tarih) : null;
        let tTarih = row.tebligat_tarihi ? new Date(row.tebligat_tarihi) : null;
        let isEmriVar = row.is_emri_no && String(row.is_emri_no).trim() !== '';
        
        let pers = row.personel ? String(row.personel).trim() : null;
        if (pers) {
            personeller.add(pers);
            if (!personelStats[pers]) personelStats[pers] = { geciken: 0, acil: 0, bekleyen: 0, biten: 0, toplam: 0 };
        }

        if (row.kontrol_durumu) {
            durum = "KontrolEdildi";
            kalanGunMetni = "Yönetici Onaylı";
            stats.kontrolEdildi++;
            if(pers) { personelStats[pers].biten++; personelStats[pers].toplam++; }
        } else if (isEmriVar) {
            durum = "Biten";
            kalanGunMetni = "İşlem Tamamlandı";
            stats.biten++;
            stats.kontrolBekliyor++;
            if(pers) { personelStats[pers].biten++; personelStats[pers].toplam++; }
        } else if (sTarih) {
            const farkMs = sTarih - bugun;
            const farkGun = Math.round(farkMs / (1000 * 60 * 60 * 24));

            if (farkGun < 0) {
                durum = "Geciken";
                kalanGunMetni = `${Math.abs(farkGun)} Gün Gecikti!`;
                stats.geciken++; if(pers) { personelStats[pers].geciken++; personelStats[pers].toplam++; }
            } else if (farkGun <= 2) {
                durum = "Acil";
                kalanGunMetni = farkGun === 0 ? "Son Gün BUGÜN!" : `${farkGun} Gün Kaldı`;
                stats.acil++; if(pers) { personelStats[pers].acil++; personelStats[pers].toplam++; }
            } else {
                durum = "Bekleyen";
                kalanGunMetni = `${farkGun} Gün Kaldı`;
                stats.bekleyen++;
                if(pers) { personelStats[pers].bekleyen++; personelStats[pers].toplam++; }
            }
        } else {
            durum = "Bekleyen";
            kalanGunMetni = "Tarih Yok";
            stats.bekleyen++;
            if(pers) { personelStats[pers].bekleyen++; personelStats[pers].toplam++; }
        }

        stats.toplam++;
        tasks.push({
            satir: row.id,
            durum: durum,
            dosyaAdi: row.dosya_adi,
            aciklama: row.aciklama,
            personel: pers,
            tebligatTarihi: tTarih ? tTarih.toLocaleDateString('tr-TR') : '-',
            sonTarih: sTarih ? sTarih.toLocaleDateString('tr-TR') : '-',
            rawTebligatTarihi: tTarih,
            rawSonTarih: sTarih,
            isEmirNo: row.is_emri_no,
            isKontrolEdildi: row.kontrol_durumu ? true : false,
            kontrolEdenTarih: row.kontrol_eden_tarih,
            kalanGunMetni: kalanGunMetni
        });
    });

    const durumOncelik = {
        "Geciken": 1,
        "Acil": 2,
        "Bekleyen": 3,
        "Biten": 4,
        "KontrolEdildi": 5
    };

    tasks.sort((a, b) => {
        let pA = durumOncelik[a.durum] || 99;
        let pB = durumOncelik[b.durum] || 99;
        if (pA !== pB) return pA - pB;
        
        let dateA = a.rawSonTarih ? a.rawSonTarih.getTime() : 0;
        let dateB = b.rawSonTarih ? b.rawSonTarih.getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        
        let dateTebA = a.rawTebligatTarihi ? a.rawTebligatTarihi.getTime() : 0;
        let dateTebB = b.rawTebligatTarihi ? b.rawTebligatTarihi.getTime() : 0;
        return dateTebB - dateTebA;
    });

    // Update Filter Pills
    const setInner = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    setInner('count-all', stats.toplam);
    setInner('count-geciken', stats.geciken);
    setInner('count-acil', stats.acil);
    setInner('count-bekleyen', stats.bekleyen);
    setInner('count-biten', stats.biten);
    setInner('count-kontrol-ok', stats.kontrolEdildi);
    setInner('count-kontrol-wait', stats.kontrolBekliyor);

    // Update Big Summary Cards
    const setBig = (id, count, text) => { const el = document.getElementById(id); if(el) el.innerText = count + ' ' + text; };
    setBig('s-geciken', stats.geciken, 'Dosya');
    setBig('s-acil', stats.acil, 'Dosya');
    setBig('s-bekleyen', stats.bekleyen, 'Dosya');
    setBig('s-biten', stats.biten, 'Dosya');
    setBig('s-kontrol', stats.kontrolEdildi, 'Onaylı');

    // Update Personel Is Yuku
    const workloadContainer = document.getElementById('personnel-grid');
    if (workloadContainer) {
        workloadContainer.innerHTML = '';
        let pArray = Object.keys(personelStats).map(p => ({ isim: p, stats: personelStats[p] }));
        pArray.sort((a,b) => b.stats.toplam - a.stats.toplam); // en cok isi olan basa
        pArray.forEach(p => {
                    if (p.stats.toplam > 0) {
        let initials = p.isim.substring(0,2).toLocaleUpperCase('tr-TR');
        let cardHtml = `
        <div class="person-card" onclick="filtreUygula('Tümü'); document.getElementById('person-filter').value='${p.isim}'; filtreleVeGoster();">
            <div class="person-header">
                <div class="person-info">
                    <h4>${p.isim}</h4>
                    <span class="person-total">${p.stats.toplam} Dosya</span>
                </div>
                <div class="person-avatar">${initials}</div>
            </div>
            <div class="person-stats-box">
                <div class="p-stat">
                    <span style="color:#ef4444;">${p.stats.geciken}</span>
                    <small>Geciken</small>
                </div>
                <div class="p-stat">
                    <span style="color:#f59e0b;">${p.stats.acil}</span>
                    <small>Acil</small>
                </div>
                <div class="p-stat">
                    <span style="color:#0ea5e9;">${p.stats.bekleyen}</span>
                    <small>Bekleyen</small>
                </div>
                <div class="p-stat">
                    <span style="color:#10b981;">${p.stats.biten}</span>
                    <small>Biten</small>
                </div>
            </div>
        </div>
        `;
        workloadContainer.innerHTML += cardHtml;
    }
        });
        if(workloadContainer.innerHTML === '') {
            workloadContainer.innerHTML = '<span style="color:var(--text-muted); font-size:12px;">Şu an kimsede aktif iş yükü yok.</span>';
        }
    }

    const pSelect = document.getElementById('m-personel-select');
    if (pSelect) {
        const mevcutDeger = pSelect.value;
        pSelect.innerHTML = '<option value="">Personel Seçin...</option>';
        Array.from(personeller).sort().forEach(p => {
            pSelect.innerHTML += `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`;
        });
        pSelect.innerHTML += '<option value="__custom__">➕ Yeni Ekle...</option>';
        if (personeller.has(mevcutDeger)) pSelect.value = mevcutDeger;
    }
    
    // update top person filter too
    const filterSelect = document.getElementById('person-filter');
    if (filterSelect) {
        const mevcut = filterSelect.value;
        filterSelect.innerHTML = '<option value="">Tüm Personeller</option>';
        Array.from(personeller).sort().forEach(p => {
            filterSelect.innerHTML += `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`;
        });
        if(personeller.has(mevcut)) filterSelect.value = mevcut;
    }

    const loadingEl = document.getElementById('loading');
    const dashboardEl = document.getElementById('dashboard');
    if (loadingEl) loadingEl.style.display = 'none';
    if (dashboardEl) dashboardEl.style.display = 'block';

    verileriEkranaBas(tasks);
}

function verileriEkranaBas(tasks) {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;
    
    let searchVal = '';
    const searchEl = document.getElementById('search-input');
    if(searchEl) searchVal = searchEl.value.toLowerCase().trim();

    let personVal = '';
    const personEl = document.getElementById('person-filter');
    if(personEl) personVal = personEl.value;

    tableBody.innerHTML = '';
    
    let eslesenler = tasks.filter(t => {
        let durumUygun = (seciliDurum === 'Tümü' || t.durum === seciliDurum || (seciliDurum === 'KontrolBekleyen' && t.durum === 'Biten' && !t.isKontrolEdildi));
        let kisiUygun = (personVal === '' || t.personel === personVal);
        let aramaUygun = true;
        if(searchVal) {
            let metin = (t.dosyaAdi + ' ' + t.aciklama + ' ' + t.personel + ' ' + t.isEmirNo).toLowerCase();
            aramaUygun = metin.includes(searchVal);
        }
        return durumUygun && kisiUygun && aramaUygun;
    });

    if (eslesenler.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: var(--text-muted);">Bu kriterde kayıt bulunamadı.</td></tr>`;
        return;
    }

    eslesenler.forEach(t => {
        let tr = document.createElement('tr');
        let badgeClass = 'badge-bekleyen';
        let rowClass = '';
        let ikon = '⏳';

        if (t.durum === 'Biten') { badgeClass = 'badge-biten'; rowClass = 'row-biten'; ikon = '✅'; } 
        else if (t.durum === 'Geciken') { badgeClass = 'badge-geciken'; rowClass = 'row-geciken'; ikon = '🚨'; } 
        else if (t.durum === 'Acil') { badgeClass = 'badge-acil'; rowClass = 'row-acil'; ikon = '⚡'; }

        tr.className = rowClass;

                let isEmirHucresi = '';
        if (t.isEmirNo) {
            let rawEmir = String(t.isEmirNo).trim();
            
            isEmirHucresi = `
                <div class="emir-card" id="emir-view-${t.satir}" style="position:relative; display:flex; align-items:flex-start; gap:8px;">
                    <div style="font-size:12.5px; color:var(--text-main); line-height:1.5; word-break:break-word; max-height:80px; overflow-y:auto; flex:1;">
                        ${escapeHtml(rawEmir)}
                    </div>
                    <button class="btn-emir-edit" onclick="isEmriDuzenleAc('${t.satir}')" title="İş Emrini Düzenle" style="background:transparent; border:none; cursor:pointer; padding:2px; font-size:14px; opacity:0.6; flex-shrink:0;">✏️</button>
                </div>
                <div class="emir-cell-open" id="emir-edit-${t.satir}" style="display: none;">
                    <textarea id="input-${t.satir}" class="input-emir-area" placeholder="İş Emri No veya UYAP Metni...">${escapeHtml(rawEmir)}</textarea>
                    <div class="emir-btn-row">
                        <button class="btn btn-success btn-xs" id="btn-${t.satir}" onclick="isEmriKaydet('${t.satir}')" title="Kaydet">💾 Kaydet</button>
                        <button class="btn btn-outline btn-xs" onclick="isEmriDuzenleKapat('${t.satir}')" title="Vazgeç">❌</button>
                    </div>
                </div>
            `;
        } else {
            let isMyTask = (aktifKullaniciRolu === 'yonetici' || (aktifKullaniciRolu === 'avukat' && t.personel === aktifKullaniciIsmi));
            if(isMyTask) {
                isEmirHucresi = `
                    <div class="emir-cell-open" id="emir-edit-${t.satir}">
                        <div style="display: flex; gap: 4px; align-items: center; width: 100%;">
                            <input type="text" id="input-${t.satir}" class="input-emir" placeholder="İş Emri / UYAP..." onkeydown="if(event.key==='Enter') isEmriKaydet('${t.satir}')" style="flex: 1; min-width: 0; padding: 4px 6px; font-size: 11.5px; height: 26px;">
                            <button class="btn btn-success btn-xs" id="btn-${t.satir}" onclick="isEmriKaydet('${t.satir}')" title="Kaydet" style="padding: 3px 6px; white-space: nowrap; height: 26px;">Kaydet</button>
                        </div>
                    </div>
                `;
            } else {
                isEmirHucresi = '<span style="color:#94a3b8; font-size:11px;">İş Emri Bekleniyor</span>';
            }
        }

        let kontrolHucresi = '';
        if (t.isKontrolEdildi) {
            kontrolHucresi = `
                <div class="kontrol-cell">
                    <span class="badge-kontrol-ok">✅ Kontrol Edildi</span>
                    <div class="kontrol-meta">${escapeHtml(t.kontrolEdenTarih || '')}</div>
                    ${aktifKullaniciRolu === 'yonetici' ? `
                    <div class="kontrol-actions-row">
                        <button class="btn-kontrol-undo" onclick="kontrolDurumuAksiyonu('${t.satir}', false)" title="Yönetici onayını geri al">Onayı Geri Al</button>
                        <button class="btn-kontrol-delete-link" onclick="kayitSilAksiyonu('${t.satir}')" title="Bu kaydı sil">🗑️ Sil</button>
                    </div>` : ''}
                </div>
            `;
        } else {
            if (aktifKullaniciRolu === 'yonetici') {
                kontrolHucresi = `
                    <div class="kontrol-cell">
                        <div class="kontrol-actions-row">
                            <button class="btn-kontrol-action btn-kontrol-approve" onclick="kontrolDurumuAksiyonu('${t.satir}', true)" title="Yönetici Kontrol Onayı Ver">
                                <span>✅</span> Kontrol Et
                            </button>
                            <button class="btn-kontrol-action btn-kontrol-delete" onclick="kayitSilAksiyonu('${t.satir}')" title="Bu kaydı sil">
                                <span>🗑️</span> Sil
                            </button>
                        </div>
                    </div>
                `;
            } else {
                kontrolHucresi = `<div class="kontrol-cell"><span style="color:#94a3b8; font-size:11.5px; font-weight:500;">⏱️ Bekliyor</span></div>`;
            }
        }

              tr.innerHTML = `
            <td style="white-space: nowrap;"><span class="badge ${badgeClass}">${ikon} ${(t.durum || '').toUpperCase()}</span></td>
            
            <td style="white-space: nowrap;" class="${aktifKullaniciRolu === 'yonetici' ? 'editable-cell' : ''}" onclick="${aktifKullaniciRolu === 'yonetici' ? `hucreDuzenleAc('${t.satir}', 'son_tarih', '${t.sonTarih}', this, 'date')` : ''}">
                <b style="font-size: 12.5px; color: var(--text-main);">${escapeHtml(t.sonTarih || '-')}</b>
                <span class="time-badge ${t.durum === 'Geciken' ? 'c-red' : (t.durum === 'Acil' ? 'c-yellow' : '')}">${escapeHtml(t.kalanGunMetni || '')}</span>
            </td>
            
            <td class="cell-dosya ${aktifKullaniciRolu === 'yonetici' ? 'editable-cell' : ''}" onclick="${aktifKullaniciRolu === 'yonetici' ? `hucreDuzenleAc('${t.satir}', 'dosya_adi', '${escapeHtml((t.dosyaAdi || '').replace(/'/g, "\\'"))}', this, 'text')` : ''}">
                <div class="dosya-title">${escapeHtml(t.dosyaAdi || 'İsimsiz Dosya')}</div>
                <span class="dosya-sub">Tebliğ: ${escapeHtml(t.tebligatTarihi || '-')}</span>
            </td>
            
            <td class="cell-aciklama ${aktifKullaniciRolu === 'yonetici' ? 'editable-cell' : ''}" onclick="${aktifKullaniciRolu === 'yonetici' ? `hucreDuzenleAc('${t.satir}', 'aciklama', '${escapeHtml((t.aciklama || '').replace(/'/g, "\\'"))}', this, 'textarea')` : ''}">${escapeHtml(t.aciklama || '-')}</td>
            
            <td class="cell-surec editable-cell" style="cursor:pointer;" onclick="herkesDuzenleyebilir(this, '${t.satir}', 'surec_aciklamasi', '${escapeHtml((t.surec_aciklamasi || '').replace(/'/g, "\\'"))}')" title="Süreci veya ara işlemleri düzenlemek için tıklayın">
                ${escapeHtml(t.surec_aciklamasi || '-')}
            </td>
            
            <td class="cell-personel ${aktifKullaniciRolu === 'yonetici' ? 'editable-cell' : ''}" onclick="${aktifKullaniciRolu === 'yonetici' ? `hucreDuzenleAc('${t.satir}', 'personel', '${escapeHtml(t.personel || '')}', this, 'select')` : ''}"><span class="personel-tag">👤 ${escapeHtml(t.personel || 'Atanmadı')}</span></td>
            
            <td class="cell-emir">${isEmirHucresi}</td>
            <td class="cell-kontrol">${kontrolHucresi}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// ==========================================
// AKSİYONLAR VE MODALLAR
// ==========================================

let currentTasks = [];
let aktifKullaniciRolu = 'avukat';
let aktifKullaniciIsmi = '';

async function cikisYap() {
    await window.sb.auth.signOut();
    window.location.reload();
}

function filtreleVeGoster() {
    if(currentTasks.length > 0) verileriEkranaBas(currentTasks);
}

function filtreUygula(durum) {
    seciliDurum = durum;
    document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.remove('active'));
    
    if (durum === 'Tümü') document.getElementById('pill-all')?.classList.add('active');
    else if (durum === 'Geciken') document.getElementById('pill-geciken')?.classList.add('active');
    else if (durum === 'Acil') document.getElementById('pill-acil')?.classList.add('active');
    else if (durum === 'Bekleyen') document.getElementById('pill-bekleyen')?.classList.add('active');
    else if (durum === 'Biten') document.getElementById('pill-biten')?.classList.add('active');
    else if (durum === 'KontrolEdildi') document.getElementById('pill-kontrol-ok')?.classList.add('active');
    else if (durum === 'KontrolBekleyen') document.getElementById('pill-kontrol-wait')?.classList.add('active');

    filtreleVeGoster();
}

function isEmriDuzenleAc(satir) {
    document.getElementById('emir-view-' + satir).style.display = 'none';
    document.getElementById('emir-edit-' + satir).style.display = 'block';
}

function isEmriDuzenleKapat(satir) {
    document.getElementById('emir-view-' + satir).style.display = 'flex';
    document.getElementById('emir-edit-' + satir).style.display = 'none';
}

async function isEmriKaydet(satir) {
    const inputVal = document.getElementById('input-' + satir).value.trim();
    if (!inputVal) return toastGoster('İş emri boş olamaz!', 'error');

    const btn = document.getElementById('btn-' + satir);
    btn.disabled = true;
    btn.innerText = '...';

    const d = new Date();
    const guncelTarih = ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
    
    try {
        const { error } = await window.sb.from('tebligatlar').update({ is_emri_no: inputVal }).eq('id', satir);
        if (error) throw error;
        toastGoster('İş emri kaydedildi!', 'success');
        verileriCek();
    } catch (err) { console.error("GIRIS HATASI DETAYI:", err); console.log("URL Kontrol:", typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : "YOK");
        toastGoster('Hata: ' + err.message, 'error');
        btn.disabled = false;
        btn.innerText = 'Kaydet';
    }
}

// ŞİFRELİ AKSİYON YÖNETİMİ
let aktifAksiyonTipi = '';
let aktifSatir = '';
let aktifDurum = null;

function kontrolDurumuAksiyonu(satir, durum) {
    aktifAksiyonTipi = 'kontrol';
    aktifSatir = satir;
    aktifDurum = durum;
    sifreModaliAc(durum ? 'onaylamak' : 'onayı geri almak');
}

function kayitSilAksiyonu(satir) {
    if(!confirm("Bu tebligat kalıcı olarak silinecek. Emin misiniz?")) return;
    aktifAksiyonTipi = 'silme';
    aktifSatir = satir;
    sifreModaliAc('tamamen silmek');
}

function sifreModaliAc(islemMetni) {
    document.getElementById('sifre-modal-islem-tipi').innerText = islemMetni;
    document.getElementById('sifre-modal').style.display = 'flex';
    document.getElementById('modal-sifre-input').value = '';
    document.getElementById('sifre-hata-kutusu').style.display = 'none';
    
    const hatirla = document.getElementById('modal-sifre-hatirla').checked;
    const kayitliSifre = sessionStorage.getItem('yonetici_sifre');
    
    if (hatirla && kayitliSifre) {
        document.getElementById('modal-sifre-input').value = kayitliSifre;
        modalSifreyleGonder();
    } else {
        document.getElementById('modal-sifre-input').focus();
    }
}

function sifreModaliKapat() {
    document.getElementById('sifre-modal').style.display = 'none';
}

function modalSifreyleGonder() {
    const sifre = document.getElementById('modal-sifre-input').value;
    const btn = document.getElementById('btn-sifre-onayla');
    const errBox = document.getElementById('sifre-hata-kutusu');
    const hatirla = document.getElementById('modal-sifre-hatirla').checked;

    if (!sifre) { errBox.innerText = 'Şifre boş olamaz!'; errBox.style.display = 'block'; return; }

    btn.disabled = true;
    btn.innerText = 'Bekleyin...';
    errBox.style.display = 'none';

    const callback = (res) => {
        btn.disabled = false;
        btn.innerHTML = '<span>🔒</span> Onayla';
        if (res.success) {
            if (hatirla) sessionStorage.setItem('yonetici_sifre', sifre);
            else sessionStorage.removeItem('yonetici_sifre');
            sifreModaliKapat();
        } else {
            errBox.innerText = res.message || 'Hatalı şifre!';
            errBox.style.display = 'block';
            document.getElementById('modal-sifre-input').select();
        }
    };

    if (aktifAksiyonTipi === 'kontrol') sifreliKontrolGonder(aktifSatir, aktifDurum, sifre, callback);
    else if (aktifAksiyonTipi === 'silme') sifreliSilmeGonder(aktifSatir, sifre, callback);
}

// Güvenli RPC İstekleri (Yetki ve RLS Bypass Edilmeden Sunucuda İşlenir)
async function sifreliKontrolGonder(satir, durum, sifre, callback) {
    toastGoster(durum ? 'Dosya onaylanıyor... 🟢' : 'Kontrol onayı geri alınıyor... 🔄');
    try {
        const { error } = await window.sb.rpc('guvenli_onay', { p_id: satir, p_onay: durum, p_sifre: sifre });
        if(error) throw error;
        toastGoster('Kontrol durumu güncellendi!', 'success');
        verileriCek();
        if(callback) callback({success: true});
    } catch (err) { console.error("GIRIS HATASI DETAYI:", err); console.log("URL Kontrol:", typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : "YOK");
        toastGoster('Hata: Yetkisiz işlem veya yanlış şifre!', 'error');
        if(callback) callback({success: false, message: 'Hatalı şifre veya yetkisiz işlem!'});
    }
}

async function sifreliSilmeGonder(satir, sifre, callback) {
    toastGoster('Kayıt siliniyor... 🗑️');
    try {
        const { error } = await window.sb.rpc('guvenli_sil', { p_id: satir, p_sifre: sifre });
        if (error) throw error;
        toastGoster('Kayıt silindi!', 'success');
        verileriCek();
        if(callback) callback({success: true});
    } catch (err) { console.error("GIRIS HATASI DETAYI:", err); console.log("URL Kontrol:", typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : "YOK");
        toastGoster('Hata: Yetkisiz işlem veya yanlış şifre!', 'error');
        if(callback) callback({success: false, message: 'Hatalı şifre veya yetkisiz işlem!'});
    }
}

// ==========================================
// YENİ TEBLİGAT EKLEME (MODAL)
// ==========================================

function tebligatModaliAc() {
    document.getElementById('tebligat-modal').style.display = 'flex';
    document.getElementById('m-dosya').focus();
}
function tebligatModaliKapat() { document.getElementById('tebligat-modal').style.display = 'none'; }

function tebligatTuruDegisti() {
    const sel = document.getElementById('m-tur');
    const customInput = document.getElementById('m-tur-custom');
    
    if (sel.value === 'diger') { customInput.style.display = 'block'; customInput.focus(); } 
    else { customInput.style.display = 'none'; customInput.value = ''; }

    const selectedOpt = sel.options[sel.selectedIndex];
    const days = selectedOpt.getAttribute('data-days');
    const desc = selectedOpt.getAttribute('data-desc');

    if (days) hizliSureEkle(parseInt(days, 10));
    if (desc && !document.getElementById('m-aciklama').value) document.getElementById('m-aciklama').value = desc;
}

function hizliSureEkle(gun) {
    seciliGun = gun;
    tarihVeyaSureDegisti();
}

function tarihVeyaSureDegisti() {
    const baslangicInput = document.getElementById('m-tebligat-tarihi').value;
    const baslangic = baslangicInput ? new Date(baslangicInput) : new Date();
    const sonTarih = new Date(baslangic);
    sonTarih.setDate(sonTarih.getDate() + seciliGun);
    
    const yyyy = sonTarih.getFullYear();
    const mm = String(sonTarih.getMonth() + 1).padStart(2, '0');
    const dd = String(sonTarih.getDate()).padStart(2, '0');
    document.getElementById('m-son-tarih').value = `${yyyy}-${mm}-${dd}`;
}

function personelSelectDegisti() {
    const sel = document.getElementById('m-personel-select');
    const customInput = document.getElementById('m-personel-custom');
    if (sel.value === '__custom__') { customInput.style.display = 'block'; customInput.focus(); } 
    else { customInput.style.display = 'none'; customInput.value = ''; }
}

async function tebligatiKaydet() {
    const dosya = document.getElementById('m-dosya').value.trim();
    const tebligatTarihi = document.getElementById('m-tebligat-tarihi').value;
    const sonTarih = document.getElementById('m-son-tarih').value;
    let aciklama = document.getElementById('m-aciklama').value.trim();
    
    const turSel = document.getElementById('m-tur').value;
    const turCustom = document.getElementById('m-tur-custom').value.trim();
    if (turSel === 'diger' && turCustom) aciklama = `[${turCustom}] ` + aciklama;

    let personel = document.getElementById('m-personel-select').value;
    if (personel === '__custom__' && document.getElementById('m-personel-custom').value.trim()) {
        personel = document.getElementById('m-personel-custom').value.trim();
    }

    if (!dosya || !sonTarih || !aciklama) {
        return toastGoster('Lütfen Dosya Adı, Son Tarih ve Açıklama alanlarını eksiksiz doldurun!', 'error');
    }

    const btn = document.getElementById('btn-modal-kaydet');
    btn.disabled = true;
    btn.innerText = 'Tebligat Kaydediliyor... ⏳';

    let sTarih = sonTarih ? new Date(sonTarih.split('.').reverse().join('-')) : null;
    let tTarih = tebligatTarihi ? new Date(tebligatTarihi.split('.').reverse().join('-')) : null;
    
    try {
        const { error } = await window.sb.from('tebligatlar').insert([{
            dosya_adi: dosya,
            aciklama: aciklama,
            personel: personel,
            tebligat_tarihi: tTarih,
            son_tarih: sTarih
        }]);

        if (error) throw error;
        toastGoster('Tebligat başarıyla eklendi!', 'success');
        tebligatModaliKapat();
        document.getElementById('m-dosya').value = '';
        document.getElementById('m-aciklama').value = '';
        verileriCek();
    } catch (err) { console.error("GIRIS HATASI DETAYI:", err); console.log("URL Kontrol:", typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : "YOK");
        toastGoster('Hata: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>💾</span> Tebligatı Kaydet';
    }
}









function exceleAktar() {
    if (!currentTasks || currentTasks.length === 0) {
        toastGoster('Aktarılacak veri bulunamadı.', 'error');
        return;
    }

    let searchVal = '';
    const searchEl = document.getElementById('search-input');
    if(searchEl) searchVal = searchEl.value.toLowerCase().trim();

    let personVal = '';
    const personEl = document.getElementById('person-filter');
    if(personEl) personVal = personEl.value;

    let eslesenler = currentTasks.filter(t => {
        let durumUygun = (seciliDurum === 'Tümü' || t.durum === seciliDurum || (seciliDurum === 'KontrolBekleyen' && t.durum === 'Biten' && !t.isKontrolEdildi));
        let kisiUygun = (personVal === '' || t.personel === personVal);
        let aramaUygun = true;
        if(searchVal) {
            let metin = (t.dosyaAdi + ' ' + t.aciklama + ' ' + t.personel + ' ' + t.isEmirNo).toLowerCase();
            aramaUygun = metin.includes(searchVal);
        }
        return durumUygun && kisiUygun && aramaUygun;
    });

    if(eslesenler.length === 0) {
        toastGoster('Eşleşen kayıt bulunamadı.', 'error');
        return;
    }

    let csvContent = "DURUM;SON TARIH;TEBLIGAT TARIHI;DOSYA BILGISI;ISLEM ACIKLAMASI;SORUMLU;IS EMRI BILGISI;KONTROL\n";
    
    eslesenler.forEach(t => {
        let durumStr = t.durum;
        if(t.isKontrolEdildi) durumStr = "Kontrol Edildi";
        
        let row = [
            `"${durumStr}"`,
            `"${t.sonTarih}"`,
            `"${t.tebligatTarihi}"`,
            `"${(t.dosyaAdi || '').replace(/"/g, '""')}"`,
            `"${(t.aciklama || '').replace(/"/g, '""')}"`,
            `"${(t.personel || '').replace(/"/g, '""')}"`,
            `"${(t.isEmirNo || '').replace(/"/g, '""')}"`,
            `"${t.isKontrolEdildi ? 'Onayli' : 'Bekliyor'}"`
        ];
        csvContent += row.join(';') + "\n";
    });

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Tebligatlar_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastGoster(`${eslesenler.length} adet kayıt başarıyla indirildi.`, 'success');
}












// ==========================================
// INLINE EDITING (YÖNETİCİ İÇİN)
// ==========================================
window.hucreDuzenleAc = function(satirId, alanAdi, mevcutDeger, tdElement, tip) {
    if (aktifKullaniciRolu !== 'yonetici') return;
    if (tdElement.querySelector('.inline-edit-input')) return; // Already editing
    
    let originalHtml = tdElement.innerHTML;
    let inputHtml = '';
    
    let parsedValue = mevcutDeger;
    if (mevcutDeger && mevcutDeger !== '-' && tip === 'date') {
        let parts = mevcutDeger.split('.');
        if (parts.length === 3) {
            parsedValue = parts[2] + '-' + parts[1] + '-' + parts[0];
        }
    }

    if (tip === 'date') {
        inputHtml = `<input type="date" class="inline-edit-input form-control" value="${parsedValue}" style="width:100%; padding:4px; font-size:12px;">`;
    } else if (tip === 'select') {
        let personellerList = Array.from(document.getElementById('m-personel-select').options).map(o => o.value).filter(v => v && v !== '__custom__');
        let opts = personellerList.map(o => `<option value="${o}" ${o===mevcutDeger?'selected':''}>${o}</option>`).join('');
        inputHtml = `<select class="inline-edit-input form-control" style="width:100%; padding:4px; font-size:12px;">${opts}</select>`;
    } else if (tip === 'textarea') {
        inputHtml = `<textarea class="inline-edit-input form-control" style="width:100%; padding:4px; font-size:12px; min-height:60px;">${escapeHtml(mevcutDeger)}</textarea>`;
    } else {
        inputHtml = `<input type="text" class="inline-edit-input form-control" value="${escapeHtml(mevcutDeger)}" style="width:100%; padding:4px; font-size:12px;">`;
    }
    
    tdElement.innerHTML = inputHtml;
    let inputEl = tdElement.querySelector('.inline-edit-input');
    inputEl.focus();
    
    let iptalEt = () => {
        tdElement.innerHTML = originalHtml;
    };
    
    let kaydet = async () => {
        let yeniDeger = inputEl.value;
        if (yeniDeger === parsedValue || (tip !== 'date' && yeniDeger === mevcutDeger)) {
            iptalEt();
            return;
        }
        
        try {
            inputEl.disabled = true;
            let updateObj = {};
            
            if (tip === 'date') {
                updateObj[alanAdi] = yeniDeger ? new Date(yeniDeger) : null;
            } else {
                updateObj[alanAdi] = yeniDeger;
            }
            
            const { error } = await window.sb.from('tebligatlar').update(updateObj).eq('id', satirId);
            if (error) throw error;
            toastGoster('Kayıt güncellendi!', 'success');
            verileriCek(); // Yeniden yükle
        } catch (err) { console.error("GIRIS HATASI DETAYI:", err); console.log("URL Kontrol:", typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : "YOK");
            toastGoster('Hata: ' + err.message, 'error');
            iptalEt();
        }
    };
    
    inputEl.addEventListener('blur', kaydet);
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && tip !== 'textarea') kaydet();
        if (e.key === 'Escape') iptalEt();
    });
};


