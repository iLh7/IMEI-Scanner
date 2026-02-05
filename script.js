let data = [], scanLocked = false;

function notify(text, isError = false) {
    if (!isError) {
        const speech = new SpeechSynthesisUtterance("لقد تم مسح imei");
        speech.lang = 'ar-SA';
        window.speechSynthesis.speak(speech);
    }
    const t = document.createElement('div');
    t.className = `toast`;
    t.style.backgroundColor = isError ? '#ff9500' : '#34c759';
    t.innerText = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
}

function cleanIMEI(t) {
    let n = t.replace(/\D/g, '');
    return n.length === 15 ? n : null;
}

function addRow(imei, model) {
    data.push({ model, imei });
    const i = data.length - 1;
    const row = `<tr id="r${i}"><td>${model}</td><td>${imei}</td><td><button style="border:none;background:none;color:red" onclick="del(${i})">❌</button></td></tr>`;
    document.getElementById('tableBody').insertAdjacentHTML('afterbegin', row);
}

function del(i) {
    data.splice(i, 1);
    document.getElementById('r' + i).remove();
}

// --- إعدادات حل مشكلة الفوكس والمسافة ---
const html5QrCode = new Html5Qrcode("reader");

const config = {
    fps: 30,
    // جعل منطقة المسح مستطيلة جداً ونحيفة لزيادة حدة التركيز على الباركود
    qrbox: { width: 350, height: 80 }, 
    aspectRatio: 1.777778,
    // دعم الباركود (1D) هو السر في المسافة البعيدة
    formatsToSupport: [ Html5QrcodeSupportedFormats.CODE_128 ]
};

// إجبار الكاميرا على وضع "التركيز المستمر" لآيفون 13
const videoConstraints = {
    facingMode: "environment",
    advanced: [{ focusMode: "continuous" }, { zoom: 1.5 }] // زووم خفيف تلقائي لتحسين المسافة
};

html5QrCode.start(
    videoConstraints, 
    config,
    (decodedText) => {
        if (scanLocked) return;
        const imei = cleanIMEI(decodedText);
        const model = document.getElementById('model').value;

        if (!imei || !model) {
            if (!model && !scanLocked) {
                scanLocked = true;
                notify("اختر الموديل أولاً", true);
                setTimeout(() => scanLocked = false, 2000);
            }
            return;
        }

        if (data.some(d => d.imei === imei)) {
            scanLocked = true;
            notify("⚠️ مكرر", true);
            setTimeout(() => scanLocked = false, 2500);
            return;
        }

        scanLocked = true;
        addRow(imei, model);
        notify("تم المسح");
        setTimeout(() => scanLocked = false, 1500);
    }
).catch(err => {
    // إذا فشل الزووم أو الفوكس المتقدم، يبدأ بالوضع العادي
    html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => { /* نفس المنطق */ });
});

function downloadCSV() {
    let csv = '\uFEFFModel,IMEI\n';
    data.forEach(d => csv += `${d.model},${d.imei}\n`);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `Sales.csv`;
    link.click();
}

function addManual() {
    let imei = prompt('ادخل IMEI (15 رقم)');
    if (imei && /^[0-9]{15}$/.test(imei)) {
        let model = document.getElementById('model').value;
        if (model) addRow(imei, model);
        else alert("اختر النوع");
    }
}
