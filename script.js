let data = [], scanLocked = false;

function cleanIMEI(t) {
  // البحث عن أي تسلسل مكون من 15 رقم داخل النص الممسوح
  let match = t.match(/\b\d{15}\b/);
  return match ? match[0] : null;
}

function addRow(imei, model) {
  data.push({ model, imei });
  let i = data.length - 1;
  const row = `<tr id="r${i}">
    <td>${model}</td>
    <td>${imei}</td>
    <td><button style="width:auto; padding:5px 10px;" onclick="del(${i})">❌</button></td>
  </tr>`;
  document.getElementById('tableBody').insertAdjacentHTML('beforeend', row);
}

function del(i) {
  data.splice(i, 1);
  document.getElementById('r' + i).remove();
}

function addManual() {
  let imei = prompt('ادخل IMEI (15 رقم)');
  if (!/^[0-9]{15}$/.test(imei)) return alert('IMEI غير صالح');
  let model = document.getElementById('model').value;
  if (!model) return alert('اختر نوع الآيفون');
  if (data.some(d => d.imei === imei)) return alert('هذا الـ IMEI مضاف مسبقاً');
  addRow(imei, model);
}

// إعدادات الكاميرا المحسنة للفوكس والمسافة
const config = { 
  fps: 15, // زيادة عدد الإطارات لجعل المسح أسرع
  qrbox: { width: 250, height: 150 }, // تصغير صندوق المسح يجبر المستخدم على الابتعاد قليلاً مما يساعد على الفوكس
  aspectRatio: 1.0
};

const s = new Html5Qrcode('reader');

s.start(
  { facingMode: 'environment' },
  config,
  t => {
    if (scanLocked) return;
    let model = document.getElementById('model').value;
    if (!model) {
        alert("يرجى اختيار نوع الآيفون أولاً");
        scanLocked = true;
        setTimeout(() => scanLocked = false, 2000);
        return;
    }
    let imei = cleanIMEI(t);
    if (!imei || data.some(d => d.imei === imei)) return;
    
    scanLocked = true;
    addRow(imei, model);
    // تنبيه صوتي بسيط أو اهتزاز عند النجاح
    if (navigator.vibrate) navigator.vibrate(100);
    
    setTimeout(() => scanLocked = false, 2500);
  }
).then(() => {
  // محاولة تفعيل الفوكس التلقائي المتقدم بعد تشغيل الكاميرا
  const track = s.getRunningTrack();
  const capabilities = track.getCapabilities();
  
  if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
    track.applyConstraints({
      advanced: [{ focusMode: 'continuous' }]
    });
  }
}).catch(err => console.error("Error starting scanner: ", err));

function downloadCSV() {
  if (data.length === 0) return alert("لا توجد بيانات لتحميلها");
  let csv = 'Model,IMEI\n';
  data.forEach(d => csv += `${d.model},${d.imei}\n`);
  let encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
  let link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "IMEI_List.csv");
  document.body.appendChild(link);
  link.click();
}
