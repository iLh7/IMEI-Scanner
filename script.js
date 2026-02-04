let data=[],scanLocked=false;

function cleanIMEI(t){
  let n=t.replace(/\D/g,'');
  return n.length===15?n:null;
}

function addRow(imei,model){
  data.push({model,imei});
  let i=data.length-1;
  document.getElementById('tableBody').innerHTML+=
  `<tr id=r${i}>
    <td>${model}</td>
    <td>${imei}</td>
    <td><button onclick=del(${i})>❌</button></td>
  </tr>`;
}

function del(i){
  data.splice(i,1);
  document.getElementById('r'+i).remove();
}

function addManual(){
  let imei=prompt('ادخل IMEI (15 رقم)');
  if(!/^[0-9]{15}$/.test(imei))return alert('IMEI غير صالح');
  let model=document.getElementById('model').value;
  if(!model)return alert('اختر نوع الآيفون');
  if(data.some(d=>d.imei===imei))return;
  addRow(imei,model);
}

const s=new Html5Qrcode('reader');
s.start(
  {facingMode:'environment'},
  {fps:5,qrbox:{width:.8*innerWidth,height:.8*innerWidth}},
  t=>{
    if(scanLocked)return;
    let model=document.getElementById('model').value;
    if(!model)return;
    let imei=cleanIMEI(t);
    if(!imei||data.some(d=>d.imei===imei))return;
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
