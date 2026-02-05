let data = [];
let scanLocked = false;

// وظائف التنبيه
function notify(text, isError = false) {
    if (!isError) {
        const speech = new SpeechSynthesisUtterance("لقد تم مسح imei");
        speech.lang = 'ar-SA';
        window.speechSynthesis.speak(speech);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.backgroundColor = isError ? '#ff9500' : '#34c759';
    t.innerText = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

function cleanIMEI(t) {
    let n = t.replace(/\D/g, ''); 
    return n.length === 15 ? n : null;
}

function addRow(imei, model) {
    data.push({ model, imei });
    const i = data.length - 1;
    const row = `<tr id="r${i}">
        <td>${model}</td>
        <td>${imei}</td>
        <td><button style="border:none;background:none;color:red;font-size:18px" onclick="del(${i})">❌</button></td>
    </tr>`;
    document.getElementById('tableBody').insertAdjacentHTML('afterbegin', row);
}

function del(i) {
    data.splice(i, 1);
    const el = document.getElementById('r' + i);
    if(el) el.remove();
}

// --- المحرك المطور للمسح عبر الصور الثابتة ---
const html5QrCode = new Html5Qrcode("reader");

// بدء الكاميرا للعرض فقط
html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 100 } }, () => {});

async function captureAndScan() {
    if (scanLocked) return;
    const model = document.getElementById('model').value;
    if (!model) return notify("⚠️ اختر الموديل أولاً", true);

    scanLocked = true;
    notify("جاري المسح بأعلى دقة...", false);

    try {
        const video = document.querySelector("#reader video");
        const canvas = document.createElement("canvas");
        
        // استخدام أقصى دقة توفرها الكاميرا حالياً
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        
        // تحسين الصورة الملتقطة (زيادة التباين برمجياً)
        ctx.filter = 'contrast(1.4) brightness(1.1)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            const file = new File([blob], "imei_scan.png", { type: "image/png" });
            
            // استخدام المسح من ملف (أقوى محرك في المكتبة)
            html5QrCode.scanFile(file, true)
                .then(decodedText => {
                    const imei = cleanIMEI(decodedText);
                    if (imei) {
                        if (data.some(d => d.imei === imei)) {
                            notify("⚠️ مكرر مسبقاً", true);
                        } else {
                            addRow(imei, model);
                            notify("تم المسح بنجاح");
                        }
                    }
                    scanLocked = false;
                })
                .catch(err => {
                    console.log("Scan failed:", err);
                    notify("تعذر المسح، قرب العدسة أكثر وثبت يدك", true);
                    scanLocked = false;
                });
        }, 'image/png', 1.0); // جودة كاملة 100%
    } catch (e) {
        notify("خطأ في معالجة الصورة", true);
        scanLocked = false;
    }
}

function downloadCSV() {
    if (data.length === 0) return;
    let csv = '\uFEFFModel,IMEI\n';
    data.forEach(d => csv += `${d.model},${d.imei}\n`);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `Sales_Log.csv`;
    link.click();
}

function addManual() {
    let imei = prompt('ادخل IMEI (15 رقم)');
    if (imei && /^[0-9]{15}$/.test(imei)) {
        let model = document.getElementById('model').value;
        if (model) addRow(imei, model);
        else alert("اختر الموديل أولاً");
    }
}
