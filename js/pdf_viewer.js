export function initPdfViewer(ui) {
  const { pdfInput, pdfCanvas, pageNumEl, pageCountEl, prevBtn, nextBtn, dbg } = ui;
  const ctx = pdfCanvas.getContext("2d");

  let pdfDoc = null;
  let currentPage = 1;
  let pageRendering = false;
  let pendingPage = null;

  // worker setup (safe)
  try {
    if (window.pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js";
    }
  } catch (e) {
    console.warn("PDF worker setup failed:", e);
  }

  async function renderPage(num) {
    if (!pdfDoc) return;
    pageRendering = true;

    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: 1.3 });

    pdfCanvas.width = Math.floor(viewport.width);
    pdfCanvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    pageRendering = false;
    pageNumEl.textContent = String(currentPage);
    pageCountEl.textContent = String(pdfDoc.numPages);

    if (pendingPage !== null) {
      const n = pendingPage;
      pendingPage = null;
      renderPage(n);
    }
  }

  function queueRender(num) {
    if (pageRendering) pendingPage = num;
    else renderPage(num);
  }

  async function loadPdfFromFile(file) {
    if (!window.pdfjsLib) {
      alert("PDF.js failed to load. Refresh the page.");
      return;
    }
    const arrayBuffer = await file.arrayBuffer();
    pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    currentPage = 1;
    queueRender(currentPage);
    dbg("pdf loaded ✅");
  }

  function turnNextPage() {
    if (!pdfDoc) return;
    if (currentPage >= pdfDoc.numPages) return;
    currentPage++;
    queueRender(currentPage);
  }

  function turnPrevPage() {
    if (!pdfDoc) return;
    if (currentPage <= 1) return;
    currentPage--;
    queueRender(currentPage);
  }

  pdfInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) loadPdfFromFile(file);
  });

  prevBtn.addEventListener("click", turnPrevPage);
  nextBtn.addEventListener("click", turnNextPage);

  return { turnNextPage, turnPrevPage, hasPdf: () => !!pdfDoc };
}