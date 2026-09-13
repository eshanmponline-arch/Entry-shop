const KEY="shreeShyamMoneyEntriesV2";
const $=id=>document.getElementById(id);
let entries=loadEntries();

function loadEntries(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return[]}}
function saveEntries(){localStorage.setItem(KEY,JSON.stringify(entries))}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}
function maskAadhaar(a){const x=String(a||"").replace(/\D/g,"");return x.length===12?"XXXX XXXX "+x.slice(-4):(x?"XXXX":"-")}
function dateText(iso){return new Date(iso).toLocaleString("hi-IN",{dateStyle:"medium",timeStyle:"short"})}
function todayKey(iso){return new Date(iso).toLocaleDateString("en-CA")}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function updateRemaining(){
  const old=Number($("oldBalance").value)||0, wd=Number($("withdraw").value)||0;
  $("remaining").value=Math.max(0,old-wd).toFixed(2);
}
$("oldBalance").addEventListener("input",updateRemaining);$("withdraw").addEventListener("input",updateRemaining);

function render(){
  const q=$("search").value.trim().toLowerCase();
  const filtered=entries.filter(e=>[e.name,e.bank,e.aadhaar].join(" ").toLowerCase().includes(q))
    .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  $("recordsBody").innerHTML="";$("empty").style.display=filtered.length?"none":"block";
  filtered.forEach((e,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${i+1}</td><td><strong>${esc(e.name)}</strong></td><td>${maskAadhaar(e.aadhaar)}</td>
    <td>${esc(e.bank||"-")}</td><td>${money(e.oldBalance)}</td><td>${money(e.withdraw)}</td><td><strong>${money(e.remaining)}</strong></td>
    <td>${dateText(e.createdAt)}</td><td>
    <button class="mini edit" onclick="editEntry('${e.id}')">✏️ Edit</button>
    <button class="mini pdf" onclick="makeReceipt('${e.id}')">🧾 PDF</button>
    <button class="mini del" onclick="deleteEntry('${e.id}')">🗑️ Delete</button></td>`;
    $("recordsBody").appendChild(tr);
  });
  const today=new Date().toLocaleDateString("en-CA"), todays=entries.filter(e=>todayKey(e.createdAt)===today);
  $("todayCount").textContent=todays.length;
  $("todayWithdraw").textContent=money(todays.reduce((s,e)=>s+Number(e.withdraw),0));
  $("totalCount").textContent=entries.length;
}

$("entryForm").addEventListener("submit",e=>{
  e.preventDefault();
  const aadhaar=$("aadhaar").value.replace(/\D/g,"");
  if(aadhaar&&aadhaar.length!==12){alert("Aadhaar नंबर 12 अंकों का होना चाहिए।");return}
  const oldBalance=Number($("oldBalance").value)||0,withdraw=Number($("withdraw").value)||0;
  if(withdraw>oldBalance){alert("निकाली गई राशि पहले के बैलेंस से अधिक नहीं हो सकती।");return}
  const editId=$("editId").value;
  const data={id:editId||crypto.randomUUID(),name:$("name").value.trim(),aadhaar,bank:$("bank").value.trim(),
    oldBalance,withdraw,remaining:oldBalance-withdraw,
    createdAt:editId?(entries.find(x=>x.id===editId)?.createdAt||new Date().toISOString()):new Date().toISOString()};
  if(editId){const i=entries.findIndex(x=>x.id===editId);if(i>=0)entries[i]=data}else entries.push(data);
  saveEntries();resetForm();render();alert("एंट्री सफलतापूर्वक सेव हो गई।");
});

$("savePdfBtn").addEventListener("click",()=>{
  const aadhaar=$("aadhaar").value.replace(/\D/g,"");
  if(aadhaar&&aadhaar.length!==12){alert("Aadhaar नंबर 12 अंकों का होना चाहिए।");return}
  const oldBalance=Number($("oldBalance").value)||0,withdraw=Number($("withdraw").value)||0;
  if(withdraw>oldBalance){alert("निकाली गई राशि पहले के बैलेंस से अधिक नहीं हो सकती।");return}
  const editId=$("editId").value;
  const data={id:editId||crypto.randomUUID(),name:$("name").value.trim(),aadhaar,bank:$("bank").value.trim(),
    oldBalance,withdraw,remaining:oldBalance-withdraw,
    createdAt:editId?(entries.find(x=>x.id===editId)?.createdAt||new Date().toISOString()):new Date().toISOString()};
  if(editId){const i=entries.findIndex(x=>x.id===editId);if(i>=0)entries[i]=data}else entries.push(data);
  saveEntries();resetForm();render();makeReceipt(data.id);
});

$("clearBtn").addEventListener("click",resetForm);$("search").addEventListener("input",render);

function resetForm(){$("entryForm").reset();$("editId").value="";$("oldBalance").value="0";$("withdraw").value="0";$("remaining").value="0";$("formTitle").textContent="नई ग्राहक एंट्री"}
window.editEntry=id=>{const e=entries.find(x=>x.id===id);if(!e)return;$("editId").value=e.id;$("name").value=e.name;$("aadhaar").value=e.aadhaar;$("bank").value=e.bank;$("oldBalance").value=e.oldBalance;$("withdraw").value=e.withdraw;updateRemaining();$("formTitle").textContent="एंट्री एडिट करें";scrollTo({top:0,behavior:"smooth"})};
window.deleteEntry=id=>{if(!confirm("क्या आप यह एंट्री हटाना चाहते हैं?"))return;entries=entries.filter(e=>e.id!==id);saveEntries();render()};

function pdfReady(){
  if(!window.jspdf||!window.html2canvas){
    alert("PDF library लोड नहीं हुई। Internet चालू करके page refresh करें।");
    return false;
  }
  return true;
}

async function elementToPdf(element,filename,orientation="portrait"){
  if(!pdfReady()) return;
  const canvas=await html2canvas(element,{
    scale:2,
    backgroundColor:"#ffffff",
    useCORS:true,
    logging:false
  });
  const {jsPDF}=window.jspdf;
  const pdf=new jsPDF({
    orientation,
    unit:"mm",
    format:"a4",
    compress:true
  });
  const pageW=orientation==="landscape"?297:210;
  const pageH=orientation==="landscape"?210:297;
  const imgW=pageW;
  const imgH=canvas.height*imgW/canvas.width;
  const imgData=canvas.toDataURL("image/jpeg",0.96);

  let offset=0;
  while(offset<imgH){
    if(offset>0) pdf.addPage();
    pdf.addImage(imgData,"JPEG",0,-offset,imgW,imgH);
    offset+=pageH;
  }
  pdf.save(filename);
}

window.makeReceipt=async id=>{
  const e=entries.find(x=>x.id===id);
  if(!e) return;

  const area=$("pdfArea");
  const fullAadhaar = e.aadhaar ? e.aadhaar.replace(/(\d{4})(?=\d)/g,"$1 ") : "-";

  area.innerHTML=`<div class="pdf-page">
    <div class="pdf-title">श्री श्याम डिजिटल स्टूडियो</div>
    <div class="pdf-subtitle">ग्राहक पैसा एंट्री रसीद</div>
    <div class="pdf-line"></div>
    <table class="pdf-table">
      <tr><td>ग्राहक का नाम</td><td>${esc(e.name)}</td></tr>
      <tr><td>Aadhaar नंबर</td><td>${esc(fullAadhaar)}</td></tr>
      <tr><td>बैंक का नाम</td><td>${esc(e.bank||"-")}</td></tr>
      <tr><td>पहले का बैलेंस</td><td>${money(e.oldBalance)}</td></tr>
      <tr><td>निकाली गई राशि</td><td>${money(e.withdraw)}</td></tr>
      <tr><td>बचा हुआ बैलेंस</td><td>${money(e.remaining)}</td></tr>
      <tr><td>तारीख / समय</td><td>${dateText(e.createdAt)}</td></tr>
      <tr><td>Entry ID</td><td>${esc(e.id.slice(0,8).toUpperCase())}</td></tr>
    </table>
    <div class="pdf-foot">यह कंप्यूटर द्वारा बनाई गई रसीद है।<br>धन्यवाद</div>
  </div>`;

  await new Promise(r=>setTimeout(r,200));
  await elementToPdf(
    area.firstElementChild,
    `receipt-${e.name.replace(/[^a-z0-9]/gi,"_")}-${Date.now()}.pdf`,
    "portrait"
  );
  area.innerHTML="";
};

$("exportAllBtn").addEventListener("click",async()=>{
  if(!entries.length){
    alert("रिपोर्ट बनाने के लिए कोई एंट्री नहीं है।");
    return;
  }

  const area=$("pdfArea");
  const rows=entries.slice()
    .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
    .map((e,i)=>{
      const fullAadhaar=e.aadhaar?e.aadhaar.replace(/(\d{4})(?=\d)/g,"$1 "):"-";
      return `<tr>
        <td>${i+1}</td>
        <td>${esc(e.name)}</td>
        <td>${esc(fullAadhaar)}</td>
        <td>${esc(e.bank||"-")}</td>
        <td>${money(e.oldBalance)}</td>
        <td>${money(e.withdraw)}</td>
        <td>${money(e.remaining)}</td>
        <td>${dateText(e.createdAt)}</td>
      </tr>`;
    }).join("");

  area.innerHTML=`<div class="pdf-report-page">
    <div class="pdf-report-title">श्री श्याम डिजिटल स्टूडियो</div>
    <div class="pdf-report-subtitle">सभी ग्राहक एंट्री रिपोर्ट</div>
    <div class="pdf-line"></div>
    <table class="pdf-report-table">
      <thead>
        <tr>
          <th>क्रम</th><th>ग्राहक का नाम</th><th>Aadhaar नंबर</th><th>बैंक</th>
          <th>पहले का बैलेंस</th><th>निकासी</th><th>बचा बैलेंस</th><th>तारीख / समय</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;

  await new Promise(r=>setTimeout(r,200));
  await elementToPdf(
    area.firstElementChild,
    `all-entries-${new Date().toISOString().slice(0,10)}.pdf`,
    "landscape"
  );
  area.innerHTML="";
});

render();
