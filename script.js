const KEY = "shreeShyamMoneyEntriesV4";

const $ = id => document.getElementById(id);

let editingId = "";

let entries = loadEntries();


/* =========================
   DATE
========================= */

function todayISO() {

  const d = new Date();

  const year = d.getFullYear();

  const month = String(d.getMonth() + 1).padStart(2, "0");

  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================
   LOAD DATA
========================= */

function loadEntries() {

  try {

    const current =
      JSON.parse(
        localStorage.getItem(KEY) || "[]"
      );

    if (current.length) {
      return current;
    }


    /* पुराने V2/V3 records बचाने की कोशिश */

    const oldKeys = [
      "shreeShyamMoneyEntriesV3",
      "shreeShyamMoneyEntriesV2"
    ];


    for (const oldKey of oldKeys) {

      try {

        const old =
          JSON.parse(
            localStorage.getItem(oldKey) || "[]"
          );


        if (old.length) {

          return old.map(e => {

            const created =
              e.createdAt ||
              new Date().toISOString();


            return {

              id:
                e.id ||
                makeId(),

              name:
                e.name || "",

              aadhaar:
                e.aadhaar || "",

              bank:
                e.bank || "",

              oldBalance:
                Number(e.oldBalance) || 0,

              withdraw:
                Number(e.withdraw) || 0,

              remaining:
                Number(e.remaining) ||
                (
                  Number(e.oldBalance || 0) -
                  Number(e.withdraw || 0)
                ),

              entryDate:
                e.entryDate ||
                todayISO(),

              createdAt:
                created

            };

          });

        }

      } catch (err) {}

    }


    return [];

  } catch (err) {

    return [];

  }

}


/* =========================
   SAVE
========================= */

function saveEntries() {

  localStorage.setItem(
    KEY,
    JSON.stringify(entries)
  );

}


/* =========================
   ID
========================= */

function makeId() {

  if (
    window.crypto &&
    typeof crypto.randomUUID === "function"
  ) {

    return crypto.randomUUID();

  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );

}


/* =========================
   MONEY
========================= */

function money(n) {

  return "₹" +
    Number(n || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );

}


/* =========================
   AADHAAR MASK
========================= */

function maskAadhaar(a) {

  const x =
    String(a || "")
      .replace(/\D/g, "");


  if (x.length === 12) {

    return (
      "XXXX XXXX " +
      x.slice(-4)
    );

  }


  return x ? "XXXX" : "-";

}


/* =========================
   FULL AADHAAR
========================= */

function fullAadhaar(a) {

  const x =
    String(a || "")
      .replace(/\D/g, "");


  if (!x) return "-";


  return x.replace(
    /(\d{4})(?=\d)/g,
    "$1 "
  );

}


/* =========================
   ESCAPE HTML
========================= */

function esc(s) {

  return String(s ?? "")
    .replace(
      /[&<>"']/g,
      c =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[c])
    );

}


/* =========================
   DATE TEXT
========================= */

function dateOnlyText(date) {

  if (!date) return "-";


  const parts =
    date.split("-");


  if (parts.length !== 3) {
    return date;
  }


  return (
    parts[2] +
    "/" +
    parts[1] +
    "/" +
    parts[0]
  );

}


/* =========================
   TIME
========================= */

function timeText(iso) {

  if (!iso) return "-";


  return new Date(iso)
    .toLocaleTimeString(
      "hi-IN",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

}


/* =========================
   REMAINING
========================= */

function updateRemaining() {

  const oldBalance =
    Number(
      $("oldBalance").value
    ) || 0;


  const withdraw =
    Number(
      $("withdraw").value
    ) || 0;


  $("remaining").value =
    Math.max(
      0,
      oldBalance - withdraw
    ).toFixed(2);

}


$("oldBalance")
  .addEventListener(
    "input",
    updateRemaining
  );


$("withdraw")
  .addEventListener(
    "input",
    updateRemaining
  );


/* =========================
   RENDER
========================= */

function render() {

  const q =
    $("search").value
      .trim()
      .toLowerCase();


  const selectedDate =
    $("dateFilter").value;


  let filtered =
    entries.filter(e => {

      const text =
        [
          e.name,
          e.bank,
          e.aadhaar
        ]
          .join(" ")
          .toLowerCase();


      const searchMatch =
        !q ||
        text.includes(q);


      const dateMatch =
        !selectedDate ||
        e.entryDate === selectedDate;


      return (
        searchMatch &&
        dateMatch
      );

    });


  filtered.sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  );


  $("recordsBody").innerHTML = "";


  $("empty").style.display =
    filtered.length
      ? "none"
      : "block";


  filtered.forEach((e, i) => {

    const tr =
      document.createElement("tr");


    tr.innerHTML = `

      <td>${i + 1}</td>

      <td>
        <strong>
          ${esc(e.name)}
        </strong>
      </td>

      <td>
        ${maskAadhaar(e.aadhaar)}
      </td>

      <td>
        ${esc(e.bank || "-")}
      </td>

      <td>
        ${money(e.oldBalance)}
      </td>

      <td>
        ${money(e.withdraw)}
      </td>

      <td>
        <strong>
          ${money(e.remaining)}
        </strong>
      </td>

      <td>
        ${dateOnlyText(e.entryDate)}
      </td>

      <td>
        ${timeText(e.createdAt)}
      </td>

      <td>

        <button
          class="mini edit"
          onclick="editEntry('${e.id}')"
        >
          ✏️ Edit
        </button>

        <button
          class="mini pdf"
          onclick="makeReceipt('${e.id}')"
        >
          🧾 PDF
        </button>

        <button
          class="mini del"
          onclick="deleteEntry('${e.id}')"
        >
          🗑️ Delete
        </button>

      </td>

    `;


    $("recordsBody")
      .appendChild(tr);

  });


  updateStats();

}


/* =========================
   STATS
========================= */

function updateStats() {

  const today =
    todayISO();


  const todays =
    entries.filter(
      e =>
        e.entryDate === today
    );


  $("todayCount")
    .textContent =
    todays.length;


  $("todayWithdraw")
    .textContent =
    money(
      todays.reduce(
        (sum, e) =>
          sum +
          Number(e.withdraw || 0),
        0
      )
    );


  $("totalCount")
    .textContent =
    entries.length;

}


/* =========================
   CREATE DATA
========================= */

function getFormData() {

  const name =
    $("name").value.trim();


  const aadhaar =
    $("aadhaar")
      .value
      .replace(/\D/g, "");


  const bank =
    $("bank").value.trim();


  const entryDate =
    $("entryDate").value ||
    todayISO();


  const oldBalance =
    Number(
      $("oldBalance").value
    ) || 0;


  const withdraw =
    Number(
      $("withdraw").value
    ) || 0;


  if (!name) {

    alert(
      "ग्राहक का नाम लिखें।"
    );

    return null;

  }


  if (
    aadhaar &&
    aadhaar.length !== 12
  ) {

    alert(
      "Aadhaar नंबर 12 अंकों का होना चाहिए।"
    );

    return null;

  }


  if (
    withdraw > oldBalance
  ) {

    alert(
      "निकाली गई राशि पहले के बैलेंस से अधिक नहीं हो सकती।"
    );

    return null;

  }


  return {

    name,

    aadhaar,

    bank,

    entryDate,

    oldBalance,

    withdraw,

    remaining:
      oldBalance - withdraw

  };

}


/* =========================
   SAVE ENTRY
========================= */

$("entryForm")
  .addEventListener(
    "submit",
    e => {

      e.preventDefault();


      const formData =
        getFormData();


      if (!formData) {
        return;
      }


      if (editingId) {

        const index =
          entries.findIndex(
            x =>
              x.id === editingId
          );


        if (index >= 0) {

          entries[index] = {

            ...entries[index],

            ...formData

          };

        }


        alert(
          "एंट्री सफलतापूर्वक अपडेट हो गई।"
        );

      } else {

        entries.push({

          id: makeId(),

          ...formData,

          createdAt:
            new Date().toISOString()

        });


        alert(
          "एंट्री सफलतापूर्वक सेव हो गई।"
        );

      }


      saveEntries();

      resetForm();

      render();

    }
  );


/* =========================
   SAVE + PDF
========================= */

$("savePdfBtn")
  .addEventListener(
    "click",
    async () => {

      const formData =
        getFormData();


      if (!formData) {
        return;
      }


      let id = editingId;


      if (editingId) {

        const index =
          entries.findIndex(
            x =>
              x.id === editingId
          );


        if (index >= 0) {

          entries[index] = {

            ...entries[index],

            ...formData

          };

        }

      } else {

        id = makeId();


        entries.push({

          id,

          ...formData,

          createdAt:
            new Date().toISOString()

        });

      }


      saveEntries();

      render();

      resetForm();

      await makeReceipt(id);

    }
  );


/* =========================
   RESET
========================= */

function resetForm() {

  $("entryForm").reset();


  editingId = "";


  $("editId").value = "";


  $("entryDate").value =
    todayISO();


  $("oldBalance").value =
    "0";


  $("withdraw").value =
    "0";


  $("remaining").value =
    "0";


  $("formTitle")
    .textContent =
    "नई ग्राहक एंट्री";

}


/* =========================
   EDIT
========================= */

window.editEntry =
  function(id) {

    const e =
      entries.find(
        x => x.id === id
      );


    if (!e) return;


    editingId = e.id;


    $("editId").value =
      e.id;


    $("name").value =
      e.name || "";


    $("aadhaar").value =
      e.aadhaar || "";


    $("bank").value =
      e.bank || "";


    $("entryDate").value =
      e.entryDate ||
      todayISO();


    $("oldBalance").value =
      e.oldBalance || 0;


    $("withdraw").value =
      e.withdraw || 0;


    updateRemaining();


    $("formTitle")
      .textContent =
      "एंट्री एडिट करें";


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  };


/* =========================
   DELETE
========================= */

window.deleteEntry =
  function(id) {

    const e =
      entries.find(
        x => x.id === id
      );


    if (!e) return;


    if (
      !confirm(
        `क्या "${e.name}" की एंट्री हटानी है?`
      )
    ) {

      return;

    }


    entries =
      entries.filter(
        x => x.id !== id
      );


    saveEntries();

    render();

  };


/* =========================
   SEARCH / DATE
========================= */

$("search")
  .addEventListener(
    "input",
    render
  );


$("dateFilter")
  .addEventListener(
    "change",
    render
  );


$("clearDateBtn")
  .addEventListener(
    "click",
    () => {

      $("dateFilter").value = "";

      render();

    }
  );


$("clearBtn")
  .addEventListener(
    "click",
    resetForm
  );


/* =========================
   PDF CHECK
========================= */

function pdfReady() {

  if (
    !window.jspdf ||
    !window.html2canvas
  ) {

    alert(
      "PDF library लोड नहीं हुई। Internet चालू करके page refresh करें।"
    );

    return false;

  }


  return true;

}


/* =========================
   ELEMENT TO PDF
========================= */

async function elementToPdf(
  element,
  filename,
  orientation = "portrait"
) {

  if (!pdfReady()) {
    return;
  }


  const canvas =
    await html2canvas(
      element,
      {
        scale: 2,

        backgroundColor:
          "#ffffff",

        useCORS: true,

        logging: false
      }
    );


  const {
    jsPDF
  } = window.jspdf;


  const pageW =
    orientation === "landscape"
      ? 297
      : 210;


  const pageH =
    orientation === "landscape"
      ? 210
      : 297;


  const pdf =
    new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
      compress: true
    });


  const margin = 5;


  const usableW =
    pageW - margin * 2;


  const usableH =
    pageH - margin * 2;


  const imgW =
    usableW;


  const imgH =
    canvas.height *
    imgW /
    canvas.width;


  const imgData =
    canvas.toDataURL(
      "image/jpeg",
      0.95
    );


  let offset = 0;


  while (offset < imgH) {

    if (offset > 0) {
      pdf.addPage();
    }


    pdf.addImage(
      imgData,
      "JPEG",
      margin,
      margin - offset,
      imgW,
      imgH
    );


    offset += usableH;

  }


  pdf.save(filename);

}


/* =========================
   RECEIPT PDF
========================= */

window.makeReceipt =
  async function(id) {

    const e =
      entries.find(
        x => x.id === id
      );


    if (!e) return;


    const area =
      $("pdfArea");


    area.innerHTML = `

      <div class="pdf-page">

        <div class="pdf-title">
          श्री श्याम डिजिटल स्टूडियो
        </div>

        <div class="pdf-subtitle">
          ग्राहक पैसा एंट्री रसीद
        </div>

        <div class="pdf-line"></div>


        <table class="pdf-table">

          <tr>
            <td>ग्राहक का नाम</td>
            <td>${esc(e.name)}</td>
          </tr>


          <tr>
            <td>Aadhaar नंबर</td>
            <td>${esc(fullAadhaar(e.aadhaar))}</td>
          </tr>


          <tr>
            <td>बैंक का नाम</td>
            <td>${esc(e.bank || "-")}</td>
          </tr>


          <tr>
            <td>एंट्री की तारीख</td>
            <td>${dateOnlyText(e.entryDate)}</td>
          </tr>


          <tr>
            <td>पहले का बैलेंस</td>
            <td>${money(e.oldBalance)}</td>
          </tr>


          <tr>
            <td>निकाली गई राशि</td>
            <td>${money(e.withdraw)}</td>
          </tr>


          <tr>
            <td>बचा हुआ बैलेंस</td>
            <td>${money(e.remaining)}</td>
          </tr>


          <tr>
            <td>समय</td>
            <td>${timeText(e.createdAt)}</td>
          </tr>


          <tr>
            <td>Entry ID</td>
            <td>
              ${esc(
                String(e.id)
                  .slice(0, 8)
                  .toUpperCase()
              )}
            </td>
          </tr>

        </table>


        <div class="pdf-foot">

          यह कंप्यूटर द्वारा बनाई गई रसीद है।

          <br>

          धन्यवाद

        </div>

      </div>

    `;


    await new Promise(
      resolve =>
        setTimeout(resolve, 200)
    );


    await elementToPdf(

      area.firstElementChild,

      `receipt-${safeFileName(e.name)}-${Date.now()}.pdf`,

      "portrait"

    );


    area.innerHTML = "";

  };


/* =========================
   SAFE FILE NAME
========================= */

function safeFileName(name) {

  return String(name || "customer")
    .replace(
      /[^a-z0-9]/gi,
      "_"
    )
    .slice(0, 40);

}


/* =========================
   FULL REPORT
========================= */

$("exportAllBtn")
  .addEventListener(
    "click",
    async () => {

      if (!entries.length) {

        alert(
          "रिपोर्ट बनाने के लिए कोई एंट्री नहीं है।"
        );

        return;

      }


      const area =
        $("pdfArea");


      const rows =
        entries
          .slice()
          .sort(
            (a, b) =>
              new Date(b.createdAt) -
              new Date(a.createdAt)
          )
          .map(
            (e, i) => `

              <tr>

                <td>${i + 1}</td>

                <td>
                  ${esc(e.name)}
                </td>

                <td>
                  ${esc(
                    fullAadhaar(e.aadhaar)
                  )}
                </td>

                <td>
                  ${esc(e.bank || "-")}
                </td>

                <td>
                  ${money(e.oldBalance)}
                </td>

                <td>
                  ${money(e.withdraw)}
                </td>

                <td>
                  ${money(e.remaining)}
                </td>

                <td>
                  ${dateOnlyText(e.entryDate)}
                  <br>
                  ${timeText(e.createdAt)}
                </td>

              </tr>

            `
          )
          .join("");


      area.innerHTML = `

        <div class="pdf-report-page">

          <div class="pdf-report-title">
            श्री श्याम डिजिटल स्टूडियो
          </div>


          <div class="pdf-report-subtitle">
            सभी ग्राहक एंट्री रिपोर्ट
          </div>


          <div class="pdf-line"></div>


          <table class="pdf-report-table">

            <thead>

              <tr>

                <th>क्रम</th>

                <th>ग्राहक का नाम</th>

                <th>Aadhaar नंबर</th>

                <th>बैंक</th>

                <th>पहले का बैलेंस</th>

                <th>निकासी</th>

                <th>बचा बैलेंस</th>

                <th>तारीख / समय</th>

              </tr>

            </thead>


            <tbody>

              ${rows}

            </tbody>

          </table>

        </div>

      `;


      await new Promise(
        resolve =>
          setTimeout(resolve, 200)
      );


      await elementToPdf(

        area.firstElementChild,

        `all-entries-${todayISO()}.pdf`,

        "landscape"

      );


      area.innerHTML = "";

    }
  );


/* =========================
   START
========================= */

$("entryDate").value =
  todayISO();


updateRemaining();

render();
