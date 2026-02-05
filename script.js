let data = [], scanLocked = false;

// التنبيهات
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
    const row = `<tr id="r${i}"><td>${model}</td><td>${imei}</td><td><button class="btn-del" onclick="del(${i})">❌</button></td></tr>`;
    document.getElementById('tableBody').insertAdjacentHTML('afterbegin', row);
}

function del(i) {
    data.splice(i, 1);
    const el = document.getElementById('r' + i);
    if(el) el.remove();
}

// إعدادات الكاميرا والمسح
const html5QrCode = new Html5Qrcode("reader");

const config = {
    fps: 30, // سرعة عالية للالتقاط اللحظي
    qrbox: { width: 280, height: 100 }, // مطابقة المستطيل الأبيض
    aspectRatio: 1.0,
    formatsToSupport: [ Html5QrcodeSupportedFormats.CODE_128 ]
};

function startScanner() {
    html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        (decodedText) => {
            if (scanLocked) return;
            const imei = cleanIMEI(decodedText);
            const model = document.getElementById('model').value;

            if (imei && model) {
                if (data.some(d => d.imei === imei)) {
                    scanLocked = true;
                    notify("⚠️ هذا الرقم مكرر", true);
                    setTimeout(() => scanLocked = false, 2500);
                    return;
                }
                scanLocked = true;
                addRow(imei, model);
                notify("تم المسح بنجاح");
                setTimeout(() => scanLocked = false, 1500);
            } else if (!model && imei) {
                scanLocked = true;
                notify("اختر الموديل أولاً", true);
                setTimeout(() => scanLocked = false, 2000);
            }
        }
    ).catch(err => console.error("Camera Error: ", err));
}

startScanner();

function downloadCSV() {
    if (data.length === 0) return alert("الجدول فارغ!");
    let csv = '\uFEFFModel,IMEI\n';
    data.forEach(d => csv += `${d.model},${d.imei}\n`);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `Sales_${new Date().toLocaleDateString()}.csv`;
    link.click();
}

function addManual() {
    let imei = prompt('ادخل IMEI (15 رقم)');
    if (imei && /^[0-9]{15}$/.test(imei)) {
        let model = document.getElementById('model').value;
        if (model) addRow(imei, model);
        else alert("اختر الموديل");
    }
}
