// إعداد الماسح ليكون قارئ باركود سريع (Barcode Scanner)
const s = new Html5Qrcode('reader');
const config = { 
  fps: 30, // زيادة عدد الإطارات في الثانية لسرعة استجابة فائقة
  qrbox: { width: 350, height: 100 }, // مستطيل نحيف يركز فقط على خطوط الباركود
  aspectRatio: 1.777778
};

s.start(
  { facingMode: 'environment' },
  config,
  barcodeData => {
    if (scanLocked) return;

    // الباركود غالباً يعطي الرقم مباشرة بدون نصوص إضافية
    let imei = cleanIMEI(barcodeData);
    if (!imei) return;

    let model = document.getElementById('model').value;
    if (!model) {
      showStatus("يرجى اختيار الموديل أولاً", "warning");
      return;
    }

    if (data.some(d => d.imei === imei)) {
      scanLocked = true;
      showStatus("⚠️ هذا الجهاز مسجل مسبقاً", "warning");
      setTimeout(() => scanLocked = false, 2000); 
      return;
    }

    // التنفيذ الفوري
    scanLocked = true;
    addRow(imei, model);
    showStatus("✅ تم المسح بنجاح", "success");
    speak("لقد تم مسح imei");
    
    // تقليل وقت القفل لسرعة المسح المتتالي
    setTimeout(() => scanLocked = false, 1500);
  }
);
