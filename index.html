// Helper function to get filename without extension
function getFileName(file) {
    return file.name.replace(/\.[^/.]+$/, "");
}

// Merge PDFs
async function mergePDFs() {
    try {
        const files = document.getElementById('mergeInput').files;
        if (files.length < 2) throw new Error('Please select 2+ PDFs');
        
        const { PDFDocument } = PDFLib;
        const mergedPdf = await PDFDocument.create();
        const originalName = getFileName(files[0]);

        for (const file of files) {
            const fileBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(fileBytes);
            const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
        }

        const mergedBytes = await mergedPdf.save();
        saveAs(new Blob([mergedBytes], { type: 'application/pdf' }), `${originalName}_merged.pdf`);
    } catch (err) {
        alert(err.message);
    }
}

// Split PDF
async function splitPDF() {
    try {
        const file = document.getElementById('splitInput').files[0];
        const splitPage = parseInt(document.getElementById('splitPage').value);
        if (!file || isNaN(splitPage)) throw new Error('Invalid input');

        const { PDFDocument } = PDFLib;
        const fileBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        const pageCount = pdfDoc.getPageCount();
        const originalName = getFileName(file);

        if (splitPage < 1 || splitPage >= pageCount) throw new Error(`Enter a page between 1 and ${pageCount - 1}`);

        const firstPart = await PDFDocument.create();
        const secondPart = await PDFDocument.create();
        
        const firstPages = await firstPart.copyPages(pdfDoc, [...Array(splitPage).keys()]);
        const secondPages = await secondPart.copyPages(pdfDoc, [...Array(pageCount - splitPage).keys()].map(i => i + splitPage));
        
        firstPages.forEach(page => firstPart.addPage(page));
        secondPages.forEach(page => secondPart.addPage(page));
        
        const firstBytes = await firstPart.save();
        const secondBytes = await secondPart.save();
        
        saveAs(new Blob([firstBytes], { type: 'application/pdf' }), `${originalName}_part1.pdf`);
        saveAs(new Blob([secondBytes], { type: 'application/pdf' }), `${originalName}_part2.pdf`);
    } catch (err) {
        alert(err.message);
    }
}

// Image to PDF
async function imageToPDF() {
    try {
        const file = document.getElementById('imageInput').files[0];
        if (!file) throw new Error('Please select an image');
        const originalName = getFileName(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();
                const width = pdf.internal.pageSize.getWidth() - 20;
                const height = (img.height * width) / img.width;
                pdf.addImage(img, 'JPEG', 10, 10, width, height);
                pdf.save(`${originalName}_converted.pdf`);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } catch (err) {
        alert(err.message);
    }
}

// Rotate PDF
async function rotatePDF() {
    try {
        const file = document.getElementById('rotateInput').files[0];
        const angle = parseInt(document.getElementById('rotateAngle').value);
        if (!file) throw new Error('Select a PDF file');
        const originalName = getFileName(file);

        const { PDFDocument } = PDFLib;
        const bytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(bytes);
        const pages = pdfDoc.getPages();
        pages.forEach(page => page.setRotation(angle));
        
        const rotatedBytes = await pdfDoc.save();
        saveAs(new Blob([rotatedBytes], { type: 'application/pdf' }), `${originalName}_rotated.pdf`);
    } catch (err) {
        alert(err.message);
    }
}

// Add Watermark
async function addWatermark() {
    try {
        const file = document.getElementById('watermarkInput').files[0];
        const text = document.getElementById('watermarkText').value;
        if (!file || !text) throw new Error('Select PDF and enter text');
        const originalName = getFileName(file);

        const { PDFDocument, rgb } = PDFLib;
        const bytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(bytes);
        const pages = pdfDoc.getPages();
        
        pages.forEach(page => {
            page.drawText(text, {
                x: 50, y: 50,
                size: 30,
                color: rgb(0.8, 0.8, 0.8),
                opacity: 0.5
            });
        });
        
        const watermarkedBytes = await pdfDoc.save();
        saveAs(new Blob([watermarkedBytes], { type: 'application/pdf' }), `${originalName}_watermarked.pdf`);
    } catch (err) {
        alert(err.message);
    }
}

// Compress PDF
async function compressPDF() {
    try {
        const file = document.getElementById('compressInput').files[0];
        if (!file) throw new Error('Select a PDF file');
        const originalName = getFileName(file);

        const { PDFDocument } = PDFLib;
        const bytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(bytes, {
            ignoreEncryption: true,
            throwOnInvalidObject: false
        });

        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,
            compress: true
        });

        saveAs(new Blob([compressedBytes], { type: 'application/pdf' }), `${originalName}_compressed.pdf`);
    } catch (err) {
        alert(err.message);
    }
}

// Extract Text
async function extractText() {
    try {
        const file = document.getElementById('textInput').files[0];
        if (!file) throw new Error('Select a PDF file');

        const bytes = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(bytes).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ');
        }
        
        document.getElementById('textOutput').textContent = fullText;
    } catch (err) {
        alert(err.message);
    }
}
