let data = [];
let lastScanned = "";

function cleanIMEI(text) {
  const numbers = text.replace(/\D/g, "");
  if (numbers.length === 15) return numbers;
  return null;
}

function addRow(imei, model) {
  const date = new Date().toLocaleString();
  data.push({ imei, model, date });

  const rowIndex = data.length - 1;

  const row = `<tr id="row-${rowIndex}">
    <td>${imei}</td>
    <td>${model}</td>
    <td>${date}</td>
    <td><button onclick="deleteRow(${rowIndex})">❌</button></td>
  </tr>`;
  document.querySelector("#table tbody").innerHTML += row;
}

function deleteRow(index) {
  if (confirm("هل أنت متأكد أنك تريد حذف هذا السطر؟")) {
    data.splice(index, 1);
    document.querySelector(`#row-${index}`).remove();
    document.querySelectorAll("#table tbody tr").forEach((tr, i) => {
      tr.id = `row-${i}`;
      tr.querySelector("button").setAttribute("onclick", `deleteRow(${i})`);
    });
  }
}

function addManual() {
  const imei = prompt("ادخل IMEI (15 رقم)");
  if (!imei || !/^\d{15}$/.test(imei)) {
    alert("IMEI غير صالح!");
    return;
  }

  const model = prompt("اختر نوع الآيفون");
  if (!model) {
    alert("اختر نوع الآيفون!");
    return;
  }

  if (data.some(d => d.imei === imei)) {
    alert("هذا IMEI موجود بالفعل!");
    return;
  }

  addRow(imei, model);
}

const scanner = new Html5Qrcode("reader");

scanner.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: 250 },
  text => {
    const model = document.getElementById("model").value;
    if (!model) {
      alert("اختر نوع الآيفون أولاً");
      return;
    }

    const imei = cleanIMEI(text);
    if (!imei) return;
    if (imei === lastScanned) return;

    lastScanned = imei;
    addRow(imei, model);

    scanner.pause();
    setTimeout(() => scanner.resume(), 1500);
  }
);

function downloadCSV() {
  let csv = "IMEI,Model,Date
";
  data.forEach(r => { csv += `${r.imei},${r.model},${r.date}
`; });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "IMEI_List.csv";
  a.click();
}
