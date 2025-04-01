const { PDFDocument, degrees } = window.PDFLib;
const { jsPDF } = window.jspdf;

// Merge PDFs
async function mergePDFs() {
    try {
        const files = document.getElementById('mergeInput').files;
        if (files.length < 2) throw new Error('Select at least 2 PDFs');
        
        const mergedPdf = await PDFDocument.create();
        const baseName = files[0].name.replace(/\.[^/.]+$/, "");

        for (const file of files) {
            const fileBytes = await file.arrayBuffer();
            const pdf = await PDFDocument.load(fileBytes);
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
        }

        const mergedBytes = await mergedPdf.save();
        saveAs(new Blob([mergedBytes], { type: 'application/pdf' }), 
            `${baseName}_merged.pdf`);
    } catch (err) {
        alert(`Merge Error: ${err.message}`);
    }
}

// Split PDF
async function splitPDF() {
    try {
        const file = document.getElementById('splitInput').files[0];
        const splitPage = parseInt(document.getElementById('splitPage').value);
        if (!file || isNaN(splitPage)) throw new Error('Invalid input');
        
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pageCount = pdfDoc.getPageCount();
        const baseName = file.name.replace(/\.[^/.]+$/, "");

        if (splitPage < 1 || splitPage >= pageCount) {
            throw new Error(`Enter a page between 1 and ${pageCount - 1}`);
        }

        // Create parts
        const firstPart = await PDFDocument.create();
        const secondPart = await PDFDocument.create();
        
        const firstPages = await firstPart.copyPages(pdfDoc, 
            [...Array(splitPage).keys()]);
        const secondPages = await secondPart.copyPages(pdfDoc, 
            [...Array(pageCount - splitPage).keys()].map(i => i + splitPage));
        
        firstPages.forEach(page => firstPart.addPage(page));
        secondPages.forEach(page => secondPart.addPage(page));
        
        // Save parts
        const part1Bytes = await firstPart.save();
        const part2Bytes = await secondPart.save();
        
        saveAs(new Blob([part1Bytes], { type: 'application/pdf' }), 
            `${baseName}_part1.pdf`);
        saveAs(new Blob([part2Bytes], { type: 'application/pdf' }), 
            `${baseName}_part2.pdf`);
    } catch (err) {
        alert(`Split Error: ${err.message}`);
    }
}

// Rotate PDF
async function rotatePDF() {
    try {
        const file = document.getElementById('rotateInput').files[0];
        const angle = parseInt(document.getElementById('rotateAngle').value);
        if (!file) throw new Error('Select a PDF file');
        if (![90, -90, 180].includes(angle)) throw new Error('Invalid angle');

        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        const pages = pdfDoc.getPages();
        
        pages.forEach(page => {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees((currentRotation + angle) % 360));
        });

        const rotatedBytes = await pdfDoc.save();
        saveAs(new Blob([rotatedBytes], { type: 'application/pdf' }), 
            `${file.name.replace(/\.[^/.]+$/, "")}_rotated.pdf`);
    } catch (err) {
        alert(`Rotation Error: ${err.message}`);
    }
}

// Image to PDF
async function imageToPDF() {
    try {
        const file = document.getElementById('imageInput').files[0];
        if (!file) throw new Error('Select an image');

        // Get EXIF orientation
        const orientation = await new Promise(resolve => {
            EXIF.getData(file, function() {
                resolve(EXIF.getTag(this, 'Orientation') || 1);
            });
        });

        // Load image
        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = URL.createObjectURL(file);
        });

        // Handle orientation
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        if ([5,6,7,8].includes(orientation)) [width, height] = [height, width];

        // Create PDF
        const pdf = new jsPDF({
            orientation: width > height ? 'l' : 'p',
            unit: 'mm',
            format: [width * 0.264583, height * 0.264583] // Convert pixels to mm
        });
        
        pdf.addImage(img, 'JPEG', 0, 0, 
            width * 0.264583, 
            height * 0.264583
        );
        pdf.save(`${file.name.replace(/\.[^/.]+$/, "")}_converted.pdf`);
    } catch (err) {
        alert(`Conversion Error: ${err.message}`);
    }
}

// Compress PDF
async function compressPDF() {
    try {
        const file = document.getElementById('compressInput').files[0];
        if (!file) throw new Error('Select a PDF file');

        const pdfDoc = await PDFDocument.load(await file.arrayBuffer(), {
            ignoreEncryption: true,
            throwOnInvalidObject: false
        });

        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,
            compress: true
        });

        saveAs(new Blob([compressedBytes], { type: 'application/pdf' }), 
            `${file.name.replace(/\.[^/.]+$/, "")}_compressed.pdf`);
    } catch (err) {
        alert(`Compression Error: ${err.message}`);
    }
}
// PDF to Images 
async function pdfToImages() {
    try {
        const file = document.getElementById('pdfToImageInput').files[0];
        const format = document.getElementById('imageFormat').value;
        if (!file) throw new Error('Select a PDF file');

        const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
        const zip = new JSZip();

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({ 
                canvasContext: canvas.getContext('2d'), 
                viewport 
            }).promise;

            const imgData = canvas.toDataURL(`image/${format}`);
            zip.file(`page-${i}.${format}`, imgData.split(',')[1], { base64: true });
        }

        const zipFile = await zip.generateAsync({ type: 'blob' });
        saveAs(zipFile, `${file.name.replace(/.pdf$/, "")}_images.zip`);
    } catch (err) {
        alert(`Conversion Error: ${err.message}`);
    }
}
// Text Extraction 
// Initialize Tesseract workers (add to script.js)
  Tesseract.setLogging(true);
  Tesseract.createWorker = Tesseract.createWorker || Tesseract.CreateWorker;
async function extractText() {
    try {
        const file = document.getElementById('textExtractInput').files[0];
        const lang = document.getElementById('ocrLang').value;
        if (!file) throw new Error('Select a file');

        let text = '';
        
        // For PDFs
        if (file.type === 'application/pdf') {
            const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(' ');
            }
        } 
        // For Images
        else {
            const worker = await Tesseract.createWorker();
            await worker.loadLanguage(lang);
            await worker.initialize(lang);
            const { data: { text: ocrText } } = await worker.recognize(file);
            text = ocrText;
            await worker.terminate();
        }

        document.getElementById('textOutput').textContent = text;
    } catch (err) {
        alert(`Text Extraction Error: ${err.message}`);
    }
}
// Add Watermark 
async function addWatermark() {
    try {
        const file = document.getElementById('watermarkInput').files[0];
        const text = document.getElementById('watermarkText').value;
        const opacity = parseFloat(document.getElementById('watermarkOpacity').value) || 0.5;
        if (!file || !text) throw new Error('Select file and enter text');

        // For PDFs
        if (file.type === 'application/pdf') {
            const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
            const pages = pdfDoc.getPages();
            
            pages.forEach(page => {
                page.drawText(text, {
                    x: 50,
                    y: page.getHeight() - 50,
                    size: 30,
                    opacity: opacity,
                    color: PDFDocument.rgb(0.5, 0.5, 0.5)
                });
            });

            const watermarkedBytes = await pdfDoc.save();
            saveAs(new Blob([watermarkedBytes], { type: 'application/pdf' }), 
                `${file.name.replace(/\.[^/.]+$/, "")}_watermarked.pdf`);
        } 
        // For Images
        else {
            const img = await new Promise(resolve => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.src = URL.createObjectURL(file);
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(img, 0, 0);
            ctx.globalAlpha = opacity;
            ctx.font = '30px Arial';
            ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
            ctx.fillText(text, 50, img.height - 50);
            
            canvas.toBlob(blob => {
                saveAs(blob, `${file.name.replace(/\.[^/.]+$/, "")}_watermarked.${file.type.split('/')[1]}`);
            }, file.type);
        }
    }  
    catch (err) {
        alert(`Watermark Error: ${err.message}`);
    }
}
// Delete PDF Pages
async function deletePDFPages() {
    try {
        const file = document.getElementById('deletePagesInput').files[0];
        const pagesInput = document.getElementById('pagesToDelete').value;
        if (!file || !pagesInput) throw new Error('Select PDF and enter pages');

        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        const pageIndices = parsePageRanges(pagesInput, pdfDoc.getPageCount());
        
        // Keep pages NOT in the deletion list
        const pagesToKeep = Array.from({ length: pdfDoc.getPageCount() })
            .map((_, i) => i)
            .filter(i => !pageIndices.includes(i));

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);
        copiedPages.forEach(page => newPdf.addPage(page));

        const newPdfBytes = await newPdf.save();
        saveAs(new Blob([newPdfBytes], { type: 'application/pdf' }), 
            `${file.name.replace(/.pdf$/i, '_edited.pdf')}`);
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
}

// Reorder PDF Pages
async function reorderPDFPages() {
    try {
        const file = document.getElementById('reorderPagesInput').files[0];
        const orderInput = document.getElementById('newPageOrder').value;
        if (!file || !orderInput) throw new Error('Select PDF and enter new order');

        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        const pageIndices = parsePageOrder(orderInput, pdfDoc.getPageCount());

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));

        const newPdfBytes = await newPdf.save();
        saveAs(new Blob([newPdfBytes], { type: 'application/pdf' }), 
            `${file.name.replace(/.pdf$/i, '_reordered.pdf')}`);
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
}

// Helper: Convert "1,3-5" to [0,2,3,4] (zero-indexed)
function parsePageRanges(input, totalPages) {
    return input.split(',')
        .flatMap(part => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(n => Math.min(parseInt(n) - 1, totalPages - 1));
                return Array.from({ length: end - start + 1 }, (_, i) => start + i);
            }
            return [parseInt(part) - 1];
        })
        .filter(n => !isNaN(n) && n >= 0 && n < totalPages);
}

// Helper: Convert "3,1,2" to [2,0,1] (zero-indexed)
function parsePageOrder(input, totalPages) {
    return input.split(',')
        .map(n => {
            const num = parseInt(n) - 1;
            if (isNaN(num) throw new Error('Invalid page number');
            return num;
        })
        .filter(n => n >= 0 && n < totalPages);
}
