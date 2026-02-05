let data = [], scanLocked = false;
let currentTotalZoom = 1.0;
let videoTrack = null;

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
    const row = `<tr id="r${i}"><td>${model}</td><td>${imei}</td><td><button style="border:none;background:none;color:red;font-size:18px" onclick="del(${i})">❌</button></td></tr>`;
    document.getElementById('tableBody').insertAdjacentHTML('afterbegin', row);
}

function del(i) {
    data.splice(i, 1);
    const el = document.getElementById('r' + i);
    if(el) el.remove();
}

const html5QrCode = new Html5Qrcode("reader");

async function applyHybridZoom(targetValue) {
    if (!videoTrack) return;
    const videoElement = document.querySelector('#reader video');
    try {
        const capabilities = videoTrack.getCapabilities();
        let hwZoom = 1.0;
        if (capabilities.zoom) {
            hwZoom = Math.min(targetValue, capabilities.zoom.max);
            await videoTrack.applyConstraints({ advanced: [{ zoom: hwZoom }] });
        }
        let cssScale = targetValue / hwZoom;
        if (videoElement) videoElement.style.transform = `scale(${cssScale})`;
        currentTotalZoom = targetValue;
        document.getElementById('zoom-indicator').innerText = `Zoom: ${currentTotalZoom.toFixed(1)}x`;
    } catch (e) { console.error(e); }
}

function changeZoom(amount) { applyHybridZoom(Math.min(Math.max(currentTotalZoom + amount, 1.0), 10.0)); }
function setZoom(val) { applyHybridZoom(val); }

// تشغيل الكاميرا
html5QrCode.start({ facingMode: "environment" }, { fps: 25 }, () => {})
    .then(() => {
        const videoElement = document.querySelector('#reader video');
        if (videoElement && videoElement.srcObject) videoTrack = videoElement.srcObject.getVideoTracks()[0];
    });

// الدالة السحرية: التقاط وتحليل الصورة الثابتة
async function captureAndScan() {
    if (scanLocked) return;
    const model = document.getElementById('model').value;
    if (!model) return notify("⚠️ اختر الموديل أولاً", true);

    scanLocked = true;
    notify("جاري التحليل...", false);

    try {
        const video = document.querySelector("#reader video");
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
            const imageFile = new File([blob], "scan.png", { type: "image/png" });
            
            // مسح الملف الثابت بدلاً من الفيديو المتغير
            html5QrCode.scanFile(imageFile, true)
                .then(decodedText => {
                    const imei = cleanIMEI(decodedText);
                    if (imei) {
                        if (data.some(d => d.imei === imei)) notify("⚠️ مكرر مسبقاً", true);
                        else { addRow(imei, model); notify("تم المسح بنجاح"); }
                    }
                    scanLocked = false;
                })
                .catch(() => {
                    notify("لم يتم التعرف، جرب التقريب أكثر", true);
                    scanLocked = false;
                });
        });
    } catch (e) {
        notify("خطأ في الالتقاط", true);
        scanLocked = false;
    }
}

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
