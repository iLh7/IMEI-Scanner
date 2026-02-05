let data = [], scanLocked = false;

// وظيفة النطق الصوتي (غير مزعجة)
function speakStatus(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'ar-SA';
    window.speechSynthesis.speak(speech);
}

// تنبيهات بصرية هادئة
function showToast(msg, type) {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerText = msg;
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
    const row = `<tr id="r${i}">
        <td>${model}</td>
        <td>${imei}</td>
        <td><button style="background:none; color:red; width:auto; padding:5px" onclick="del(${i})">❌</button></td>
    </tr>`;
    document.getElementById('tableBody').insertAdjacentHTML('afterbegin', row); // الإضافة في الأعلى لتسهيل الرؤية
}

function del(i) {
    data.splice(i, 1);
    document.getElementById('r' + i).remove();
}

// إعداد الماسح الضوئي ليتوافق مع المسافة المطلوبة
const html5QrCode = new Html5Qrcode("reader");
html5QrCode.start(
    { facingMode: "environment" },
    {
        fps: 15, // سرعة مسح أعلى
        qrbox: { width: 280, height: 160 }, // شكل مستطيل يناسب الباركود في الصورة
        aspectRatio: 1.777778 // نسبة عرض الشاشة (16:9)
    },
    qrCodeMessage => {
        if (scanLocked) return;
        const model = document.getElementById('model').value;
        if (!model) {
            showToast("اختر نوع الجهاز أولاً", "warning");
            return;
        }

        const imei = cleanIMEI(qrCodeMessage);
        if (!imei) return;

        // التحقق من التكرار
        if (data.some(d => d.imei === imei)) {
            scanLocked = true;
            showToast("⚠️ تم مسحه مسبقاً", "warning");
            setTimeout(() => scanLocked = false, 3000);
            return;
        }

        // إضافة ناجحة
        scanLocked = true;
        addRow(imei, model);
        showToast("✅ تم التسجيل", "success");
        speakStatus("لقد تم مسح imei");
        
        setTimeout(() => scanLocked = false, 2500);
    }
).catch(err => console.error(err));

function downloadCSV() {
    if(data.length === 0) return alert("الجدول فارغ!");
    let csv = '\uFEFFModel,IMEI\n'; // إضافة BOM لدعم اللغة العربية في Excel
    data.forEach(d => csv += `${d.model},${d.imei}\n`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_Report_${new Date().toLocaleDateString()}.csv`;
    link.click();
}
