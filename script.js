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
