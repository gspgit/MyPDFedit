// Utility Functions
const showLoading = () => document.getElementById('loadingOverlay').style.display = 'flex';
const hideLoading = () => document.getElementById('loadingOverlay').style.display = 'none';

const showError = (toolId, message) => {
    const errorElement = document.getElementById(`${toolId}Error`);
    errorElement.textContent = message;
    errorElement.classList.add('active');
    setTimeout(() => errorElement.classList.remove('active'), 5000);
};

const validatePDF = async (file) => {
    const header = await file.slice(0, 4).arrayBuffer();
    const view = new Uint8Array(header);
    return view[0] === 0x25 && view[1] === 0x50 && view[2] === 0x44 && view[3] === 0x46; // %PDF
};

// Initialize File Inputs
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', async (e) => {
        const fileList = document.getElementById(`${e.target.id}FileList`);
        const files = Array.from(e.target.files);
        
        // Validate PDF files
        if (input.accept === '.pdf') {
            for (const file of files) {
                if (!await validatePDF(file)) {
                    showError(input.id.replace('Input', ''), `Invalid PDF: ${file.name}`);
                    e.target.value = '';
                    fileList.textContent = '';
                    return;
                }
            }
        }
        
        fileList.textContent = files.map(f => f.name).join(', ');
    });
});

// PDF Processing Functions
async function mergePDFs() {
    showLoading();
    try {
        const files = document.getElementById('mergeInput').files;
        if (files.length < 2) throw new Error('Please select at least 2 PDF files');
        
        const { PDFDocument } = PDFLib;
        const mergedPdf = await PDFDocument.create();
        
        for (const file of files) {
            const pdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
        }
        
        const mergedBytes = await mergedPdf.save();
        saveAs(new Blob([mergedBytes], { type: 'application/pdf' }), 'merged.pdf');
    } catch (err) {
        showError('merge', err.message);
    } finally {
        hideLoading();
    }
}

async function splitPDF() {
    showLoading();
    try {
        const file = document.getElementById('splitInput').files[0];
        const splitPage = parseInt(document.getElementById('splitPage').value);
        if (!file) throw new Error('Please select a PDF file');
        if (isNaN(splitPage) throw new Error('Please enter a valid page number');
        
        const { PDFDocument } = PDFLib;
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const totalPages = pdfDoc.getPageCount();
        
        if (splitPage < 1 || splitPage >= totalPages) throw new Error(`Enter a page between 1 and ${totalPages - 1}`);
        
        const firstDoc = await PDFDocument.create();
        const secondDoc = await PDFDocument.create();
        
        // Copy pages
        const firstPages = await firstDoc.copyPages(pdfDoc, Array.from({ length: splitPage }, (_, i) => i));
        const secondPages = await secondDoc.copyPages(pdfDoc, Array.from({ length: totalPages - splitPage }, (_, i) => i + splitPage));
        
        firstPages.forEach(page => firstDoc.addPage(page));
        secondPages.forEach(page => secondDoc.addPage(page));
        
        // Save and download
        const firstBytes = await firstDoc.save();
        const secondBytes = await secondDoc.save();
        
        saveAs(new Blob([firstBytes], { type: 'application/pdf' }), 'part1.pdf');
        saveAs(new Blob([secondBytes], { type: 'application/pdf' }), 'part2.pdf');
    } catch (err) {
        showError('split', err.message);
    } finally {
        hideLoading();
    }
}

async function imageToPDF() {
    showLoading();
    try {
        const file = document.getElementById('imageInput').files[0];
        if (!file) throw new Error('Please select an image file');
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const img = await createImageBitmap(file);
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
        
        pdf.addImage(img, 'JPEG', 0, 0, img.width * ratio, img.height * ratio);
        pdf.save('converted.pdf');
    } catch (err) {
        showError('image', err.message);
    } finally {
        hideLoading();
    }
}

async function rotatePDF() {
    showLoading();
    try {
        const file = document.getElementById('rotateInput').files[0];
        const angle = parseInt(document.getElementById('rotateAngle').value);
        if (!file) throw new Error('Please select a PDF file');
        
        const { PDFDocument } = PDFLib;
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        pdfDoc.getPages().forEach(page => page.setRotation(angle));
        
        const rotatedBytes = await pdfDoc.save();
        saveAs(new Blob([rotatedBytes], { type: 'application/pdf' }), 'rotated.pdf');
    } catch (err) {
        showError('rotate', err.message);
    } finally {
        hideLoading();
    }
}

async function addWatermark() {
    showLoading();
    try {
        const file = document.getElementById('watermarkInput').files[0];
        const text = document.getElementById('watermarkText').value.trim();
        if (!file) throw new Error('Please select a PDF file');
        if (!text) throw new Error('Please enter watermark text');
        
        const { PDFDocument, rgb } = PDFLib;
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        const pages = pdfDoc.getPages();
        const font = await pdfDoc.embedFont(PDFDocument.Font.HelveticaBold);
        
        pages.forEach(page => {
            const { width, height } = page.getSize();
            page.drawText(text, {
                x: width / 2 - (text.length * 7),
                y: height / 2,
                font,
                size: 32,
                color: rgb(0.8, 0.8, 0.8),
                opacity: 0.3
            });
        });
        
        const watermarkedBytes = await pdfDoc.save();
        saveAs(new Blob([watermarkedBytes], { type: 'application/pdf' }), 'watermarked.pdf');
    } catch (err) {
        showError('watermark', err.message);
    } finally {
        hideLoading();
    }
}

async function compressPDF() {
    showLoading();
    try {
        const file = document.getElementById('compressInput').files[0];
        if (!file) throw new Error('Please select a PDF file');
        
        const { PDFDocument } = PDFLib;
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,
            compress: true
        });
        
        saveAs(new Blob([compressedBytes], { type: 'application/pdf' }), 'compressed.pdf');
    } catch (err) {
        showError('compress', err.message);
    } finally {
        hideLoading();
    }
}

async function extractText() {
    showLoading();
    try {
        const file = document.getElementById('textInput').files[0];
        if (!file) throw new Error('Please select a PDF file');
        
        const pdfBytes = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        let text = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n\n';
        }
        
        document.getElementById('textOutput').textContent = text;
    } catch (err) {
        showError('text', err.message);
    } finally {
        hideLoading();
    }
}
