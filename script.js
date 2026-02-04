function cleanIMEI(t){
  let n=t.replace(/\D/g,'');
  return n.length===15?n:null;
}

function addRow(imei,model){
  if(data.some(d => d.imei === imei)) {
    alert('IMEI مكرر'); // Notify about duplicate IMEI
    return;
  }
  data.push({model,imei});
  let i=data.length-1;
  document.getElementById('tableBody').innerHTML+=
  `<tr id=r${i}>
    <td>${model}</td>
    <td>${imei}</td>
    <td><button onclick=del(${i})>❌</button></td>
  </tr>`;
  alert('تم مسح الايمي بنجاح!'); // Notify successful IMEI scan
}

function del(i){
  data.splice(i,1);
  document.getElementById('r'+i).remove();
}

function addManual(){
  let imei=prompt('ادخل IMEI (15 رقم)');
  if(!/^[0-9]{15}$/.test(imei)) return alert('IMEI غير صالح');
  let model=document.getElementById('model').value;
  if(!model) return alert('اختر نوع الآيفون');
  if(data.some(d => d.imei === imei)) return alert('IMEI مكرر'); // Prevent duplicate IMEI
  addRow(imei,model);
}

const s=new Html5Qrcode('reader');
s.start(
  {facingMode:'environment'},
  {fps:5, qrbox:{width: 0.95*innerWidth, height: 0.95*innerWidth}}, // Further enhanced QR reading range
  t=>{
    if(scanLocked) return;
    let model=document.getElementById('model').value;
    if(!model) return;
    let imei=cleanIMEI(t);
    if(!imei || data.some(d=>d.imei===imei)) return;
    scanLocked=true;
    addRow(imei,model);
    setTimeout(()=>scanLocked=false,2500);
  }
);

function downloadCSV(){
  let csv='Model,IMEI\n';
  data.forEach(d=>csv+=`${d.model},${d.imei}\n`);
  let a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='IMEI_List.csv';
  a.click();
}
