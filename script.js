let data = [], scanLocked = false;

// وظيفة النطق الصوتي
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'ar-SA';
  msg.rate = 0.9; // سرعة هادئة
  window.speechSynthesis.speak(msg);
}

// إظهار تنبيه هادئ (Toast)
function showStatus(message, type) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function cleanIMEI(t) {
  let n = t.replace(/\D/g, '');
  return n.length === 15 ? n : null;
}

function addRow(imei, model) {
  data.push({ model, imei });
  let i = data.length - 1;
  const row = `<tr id="r${i}">
    <td>${model}</td>
    <td>${imei}</td>
    <td><button class="btn-del" onclick="del(${i})">❌</button></td>
  </tr>`;
  document.getElementById('tableBody').insertAdjacentHTML('beforeend', row);
}

function del(i) {
  data.splice(i, 1);
  document.getElementById('r' + i).remove();
}

const s = new Html5Qrcode('reader');
s.start(
  { facingMode: 'environment' },
  { 
    fps: 10, 
    // تم تكبير الـ qrbox وتغيير إعداداته ليتناسب مع المسافة في الصورة
    qrbox: { width: 280, height: 150 } 
  },
  t => {
    if (scanLocked) return;
    let model = document.getElementById('model').value;
    if (!model) {
        showStatus("يرجى اختيار نوع الآيفون أولاً", "warning");
        return;
    }

    let imei = cleanIMEI(t);
    if (!imei) return;

    // التحقق من التكرار
    if (data.some(d => d.imei === imei)) {
      scanLocked = true;
      showStatus("هذا الـ IMEI مكرر مسبقاً", "warning");
      setTimeout(() => scanLocked = false, 3000); // قفل المسح لفترة لتجنب إزعاج التكرار
      return;
    }

    scanLocked = true;
    addRow(imei, model);
    showStatus("تم المسح بنجاح", "success");
    speak("لقد تم مسح imei"); // التنبيه الصوتي المطلوب
    
    setTimeout(() => scanLocked = false, 2500); // مهلة قبل المسح القادم
  }
);

// دالة التحميل والمmanual تبقى كما هي في ملفك الأصلي
