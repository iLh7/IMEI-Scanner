let data = [];
let scanLocked = false;
let videoTrack = null;
let currentZoom = 1.0;

// وظائف التنبيه الصوتي والبصري
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

// --- إعدادات المسح المباشر المستقرة ---
const html5QrCode = new Html5Qrcode("reader");

const qrConfig = {
    fps: 30, // سرعة عالية للالتقاط
    qrbox: { width: 300, height: 120 }, // منطقة المسح المستطيلة للباركود
    aspectRatio: 1.0
};

// وظيفة الزوم المتوافقة مع آيفون
async function applyZoom(value) {
    if (!videoTrack) return;
    try {
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.zoom) {
            const target = Math.min(Math.max(value, capabilities.zoom.min), capabilities.zoom.max);
            await videoTrack.applyConstraints({ advanced: [{ zoom: target }] });
            currentZoom = target;
            document.getElementById('zoom-indicator').innerText = `Zoom: ${currentZoom.toFixed(1)}x`;
        }
    } catch (e) {
        console.error("Zoom Error:", e);
    }
}

function changeZoom(amount) {
    applyZoom(currentZoom + amount);
}

function setZoom(val) {
    applyZoom(val);
}

// دالة المسح عند الضغط (لزيادة الدقة)
async function captureAndScan() {
    if (scanLocked) return;
    const model = document.getElementById('model').value;
    if (!model) return notify("⚠️ اختر الموديل أولاً", true);

    scanLocked = true;
    notify("جاري المسح...", false);

    // محاولة المسح من الفيديو الحالي مباشرة
    const video = document.querySelector("#reader video");
    html5QrCode.scanFile(video, true)
        .then(res => {
            const imei = cleanIMEI(res);
            if(imei) {
                if (data.some(d => d.imei === imei)) notify("⚠️ مكرر مسبقاً", true);
                else { addRow(imei, model); notify("تم المسح بنجاح"); }
            }
            scanLocked = false;
        })
        .catch(() => {
            notify("تعذر المسح، جرب التقريب بالزوم", true);
            scanLocked = false;
        });
}

// تشغيل الكاميرا فور تحميل الصفحة
html5QrCode.start({ facingMode: "environment" }, qrConfig, (decodedText) => {
    // مسح تلقائي إذا التقط الباركود صدفة
    const imei = cleanIMEI(decodedText);
    const model = document.getElementById('model').value;
    if (imei && model && !scanLocked && !data.some(d => d.imei === imei)) {
        addRow(imei, model);
        notify("تم المسح بنجاح");
    }
}).then(() => {
    const videoElement = document.querySelector('#reader video');
    if (videoElement && videoElement.srcObject) {
        videoTrack = videoElement.srcObject.getVideoTracks()[0];
    }
});

function downloadCSV() {
    if (data.length === 0) return;
    let csv = '\uFEFFModel,IMEI\n';
    data.forEach(d => csv += `${d.model},${d.imei}\n`);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `Sales_${new Date().toLocaleDateString()}.csv`;
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
