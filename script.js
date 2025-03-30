const pdfInput = document.getElementById('pdf-input');
const pdfPreview = document.getElementById('pdf-preview');

pdfInput.addEventListener('change', async (e) => {
  const files = e.target.files;
  if (!files.length) return;
  
  pdfPreview.innerHTML = `<p>${files.length} PDF(s) selected:</p>`;
  
  for (let file of files) {
    pdfPreview.innerHTML += `<p>📄 ${file.name}</p>`;
  }
});
const mergeBtn = document.getElementById('merge-btn');

mergeBtn.addEventListener('click', async () => {
    const files = pdfInput.files;
    if (!files.length) {
        alert("Upload at least 2 PDFs to merge!");
        return;
    }

    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();

    for (let file of files) {
        const fileBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    saveAs(new Blob([mergedPdfBytes], { type: 'application/pdf' }), 'merged.pdf');
});
const splitBtn = document.getElementById('split-btn');

splitBtn.addEventListener('click', async () => {
    const files = pdfInput.files;
    const splitPage = parseInt(document.getElementById('split-page').value);

    if (!files.length || isNaN(splitPage)) {
        alert("Upload a PDF and enter a valid page number!");
        return;
    }

    const { PDFDocument } = PDFLib;
    const fileBytes = await files[0].arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes);
    
    // Split into two documents
    const pageCount = pdfDoc.getPageCount();
    if (splitPage < 1 || splitPage >= pageCount) {
        alert(`Enter a page between 1 and ${pageCount - 1}`);
        return;
    }

    // First half
    const firstHalf = await PDFDocument.create();
    const firstPages = await firstHalf.copyPages(pdfDoc, [...Array(splitPage).keys()]);
    firstPages.forEach(page => firstHalf.addPage(page));
    const firstHalfBytes = await firstHalf.save();
    saveAs(new Blob([firstHalfBytes], { type: 'application/pdf' }), 'split_part1.pdf');

    // Second half
    const secondHalf = await PDFDocument.create();
    const secondPages = await secondHalf.copyPages(pdfDoc, [...Array(pageCount - splitPage).keys()].map(i => i + splitPage));
    secondPages.forEach(page => secondHalf.addPage(page));
    const secondHalfBytes = await secondHalf.save();
    saveAs(new Blob([secondHalfBytes], { type: 'application/pdf' }), 'split_part2.pdf');
});
const convertBtn = document.getElementById('convert-btn');
const imageInput = document.getElementById('image-input');

convertBtn.addEventListener('click', () => {
    const file = imageInput.files[0];
    if (!file) {
        alert("Upload an image first!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const pdf = new jsPDF();
            pdf.addImage(img, 'JPEG', 10, 10, 180, 180);
            pdf.save('converted.pdf');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});
