let data = [], scanLocked = false;

// وظائف التنبيه الصوتي والبصري
function notify(text, isError = false) {
    if (!isError) {
        const speech = new SpeechSynthesisUtterance("لقد تم مسح imei");
        speech.lang = 'ar-SA';
        window.speechSynthesis.speak(speech);
    }

    const t = document.createElement('div');
    t.className = `toast ${isError ? 'warning' : 'success'}`;
    t.innerText = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
}

function cleanIMEI(t) {
    let n = t.replace(/\D/g, ''); // استخراج الأرقام فقط
    return n.length === 15 ? n : null;
}

function addRow(imei, model) {
    data.push({ model, imei });
    const i = data.length - 1;
    // الترتيب المطلوب: الموديل أولاً (يمين)، ثم IMEI، ثم الإجراء (يسار)
    const row = `
        <tr id="r${i}">
            <td>${model}</td>
            <td>${imei}</td>
            <td><button class="btn-del" onclick="del(${i})">❌</button></td>
        </tr>`;
    document.getElementById('tableBody').insertAdjacentHTML('afterbegin', row);
}

function del(i) {
    data.splice(i, 1);
    document.getElementById('r' + i).remove();
}

// --- إعدادات الماسح الضوئي المتقدمة ---
const html5QrCode = new Html5Qrcode("reader");

const config = {
    fps: 40, // رفع التردد لأقصى حد لسرعة استجابة لحظية
    qrbox: { width: 350, height: 100 }, // مستطيل نحيف وعريض يركز بدقة على خطوط الباركود
    aspectRatio: 1.777778,
    // دعم صيغ الباركود (1D) المستخدمة في كراتين الآيفون
    formatsToSupport: [ 
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39 
    ]
};

html5QrCode.start(
    { facingMode: "environment" }, 
    config,
    (decodedText) => {
        if (scanLocked) return;

        const imei = cleanIMEI(decodedText);
        const model = document.getElementById('model').value;

        if (!imei) return;
        
        if (!model) {
            scanLocked = true;
            notify("⚠️ اختر الموديل أولاً", true);
            setTimeout(() => scanLocked = false, 2000);
            return;
        }

        // منع التكرار
        if (data.some(d => d.imei === imei)) {
            scanLocked = true;
            notify("هذا الـ IMEI مكرر مسبقاً", true);
            setTimeout(() => scanLocked = false, 2500);
            return;
        }

        scanLocked = true;
        addRow(imei, model);
        notify("تم المسح بنجاح");
        
        setTimeout(() => scanLocked = false, 1200); // مهلة قصيرة جداً للمسح المتتالي السريع
    }
).catch(err => console.error("Scanner Error: ", err));

function downloadCSV() {
    if (data.length === 0) return alert("الجدول فارغ!");
    let csv = '\uFEFFModel,IMEI\n';
    data.forEach(d => csv += `${d.model},${d.imei}\n`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_Log_${new Date().toLocaleDateString()}.csv`;
    link.click();
}
