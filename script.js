let data = [], scanLocked = false;
let currentTotalZoom = 1.0; 
let videoTrack = null;

// وظائف التنبيه (صوت + بصري)
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

// تنظيف النص المستخرج ليكون IMEI صحيح
function cleanIMEI(t) {
    let n = t.replace(/\D/g, ''); 
    return n.length === 15 ? n : null;
}

// إضافة صف للجدول (الترتيب: موديل - ايمي - حذف)
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

// --- إعدادات الماسح الضوئي الاحترافية ---
const html5QrCode = new Html5Qrcode("reader");

const config = {
    fps: 40, // سرعة معالجة عالية جداً للمسح اللحظي
    qrbox: { width: 320, height: 120 }, // مستطيل عريض مخصص لباركدوات الـ IMEI
    aspectRatio: 1.0,
    formatsToSupport: [ Html5QrcodeSupportedFormats.CODE_128 ] // التركيز على نوع باركود كراتين الآيفون
};

// وظيفة الزووم الهجين (تصل لـ 5x وتجبر الفوكس)
async function applyHybridZoom(targetValue) {
    if (!videoTrack) return;
    const videoElement = document.querySelector('#reader video');
    
    try {
        const capabilities = videoTrack.getCapabilities();
        let hwZoom = 1.0;

        // تطبيق الزووم الحقيقي للجهاز
        if (capabilities.zoom) {
            hwZoom = Math.min(targetValue, capabilities.zoom.max);
            await videoTrack.applyConstraints({
                advanced: [
                    { zoom: hwZoom },
                    { focusMode: "continuous" } // إجبار العدسة على التركيز المستمر
                ]
            });
        }

        // تكملة الزووم برمجياً (CSS Scale) للوصول لـ 5x
        let cssScale = targetValue / hwZoom;
        if (videoElement) {
            videoElement.style.transform = `scale(${cssScale})`;
        }

        currentTotalZoom = targetValue;
        document.getElementById('zoom-indicator').innerText = `Zoom: ${currentTotalZoom.toFixed(1)}x`;
    } catch (e) {
        console.error("Zoom/Focus Error:", e);
    }
}

function changeZoom(amount) {
    let nextZoom = Math.min(Math.max(currentTotalZoom + amount, 1.0), 10.0);
    applyHybridZoom(nextZoom);
}

function setZoom(value) {
    applyHybridZoom(value);
}

// تشغيل الماسح
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
                    notify("⚠️ هذا الرقم مكرر مسبقاً", true);
                    setTimeout(() => scanLocked = false, 2500);
                    return;
                }
                scanLocked = true;
                addRow(imei, model);
                notify("تم المسح بنجاح");
                setTimeout(() => scanLocked = false, 1500);
            }
        }
    ).then(() => {
        const videoElement = document.querySelector('#reader video');
        if (videoElement && videoElement.srcObject) {
            videoTrack = videoElement.srcObject.getVideoTracks()[0];
        }
    }).catch(err => console.error("Scanner Error:", err));
}

startScanner();

// تحميل ملف Excel (CSV)
function downloadCSV() {
    if (data.length === 0) return alert("الجدول فارغ!");
    let csv = '\uFEFFModel,IMEI\n';
    data.forEach(d => csv += `${d.model},${d.imei}\n`);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `Sales_Log_${new Date().toLocaleDateString()}.csv`;
    link.click();
}

// إضافة يدوية
function addManual() {
    let imei = prompt('ادخل IMEI (15 رقم)');
    if (imei && /^[0-9]{15}$/.test(imei)) {
        let model = document.getElementById('model').value;
        if (model) addRow(imei, model);
        else alert("اختر الموديل أولاً");
    }
}
