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
document.getElementById('convert-btn').addEventListener('click', () => {
  const imageInput = document.getElementById('image-input');
  const file = imageInput.files[0];

  if (!file) {
    alert("Please select an image first!");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Initialize PDF
        const pdf = new window.jspdf.jsPDF();
        
        // Calculate dimensions to fit the page
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 20; // 10px margins on both sides
        const imgHeight = (img.height * imgWidth) / img.width;

        // Add image to PDF
        pdf.addImage(img, 'JPEG', 10, 10, imgWidth, imgHeight);
        
        // Save the PDF
        pdf.save('converted-image.pdf');
      } catch (error) {
        alert("Error generating PDF: " + error.message);
        console.error(error);
      }
    };
    img.onerror = () => alert("Failed to load the image.");
    img.src = e.target.result;
  };
  reader.onerror = () => alert("Failed to read the file.");
  reader.readAsDataURL(file);
});
