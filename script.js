const { PDFDocument, degrees } = window.PDFLib;
const { jsPDF } = window.jspdf;
let previewState = { parts: [], currentPartIndex: 0, currentPage: 1 };

// Helper functions
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function getFileName(file) {
    return file.name.replace(/\.[^/.]+$/, "");
}

// Image to PDF with EXIF orientation
async function imageToPDF() {
    try {
        showLoading();
        const file = document.getElementById('imageInput').files[0];
        if (!file) throw new Error('No image selected');

        // Read EXIF data
        const exifData = await new Promise(resolve => {
            EXIF.getData(file, function() {
                resolve({
                    orientation: EXIF.getTag(this, 'Orientation') || 1,
                    data: URL.createObjectURL(file)
                });
            });
        });

        // Create image
        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = exifData.data;
        });

        // Handle orientation
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        if ([5,6,7,8].includes(exifData.orientation)) [width, height] = [height, width];

        // Create PDF
        const pdf = new jsPDF({
            orientation: width > height ? 'l' : 'p',
            unit: 'px',
            format: [width, height]
        });
        
        pdf.addImage(img, 'JPEG', 0, 0, width, height);
        pdf.save(`${getFileName(file)}_converted.pdf`);
    } catch (err) {
        alert(`Image conversion failed: ${err.message}`);
    } finally {
        hideLoading();
    }
}

// Rotate PDF with proper angle handling
async function rotatePDF() {
    try {
        showLoading();
        const file = document.getElementById('rotateInput').files[0];
        const angle = parseInt(document.getElementById('rotateAngle').value);
        if (!file) throw new Error('No PDF selected');
        if (![90, -90, 180].includes(angle)) throw new Error('Invalid rotation angle');

        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        const pages = pdfDoc.getPages();
        
        pages.forEach(page => {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees((currentRotation + angle) % 360));
        });

        const rotatedBytes = await pdfDoc.save();
        saveAs(new Blob([rotatedBytes], { type: 'application/pdf' }), 
            `${getFileName(file)}_rotated.pdf`);
    } catch (err) {
        alert(`Rotation failed: ${err.message}`);
    } finally {
        hideLoading();
    }
}

// Add other functions (mergePDFs, splitPDFs, etc.) from previous examples
// [Include all other functions from previous implementation here]

// Preview functionality
async function showPreview(parts, baseName) {
    previewState = {
        parts: await Promise.all(parts.map(async (bytes, i) => {
            const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
            return { bytes, name: `${baseName}_part${i+1}.pdf`, pages: pdf.numPages };
        })),
        currentPartIndex: 0,
        currentPage: 1
    };
    await renderPreview();
    document.getElementById('previewModal').style.display = 'block';
}

async function renderPreview() {
    const part = previewState.parts[previewState.currentPartIndex];
    const pdf = await pdfjsLib.getDocument({ data: part.bytes }).promise;
    const page = await pdf.getPage(previewState.currentPage);
    
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: ctx, viewport }).promise;
    
    const preview = document.getElementById('pdfPreview');
    preview.innerHTML = '';
    preview.appendChild(canvas);
    document.getElementById('currentPage').textContent = 
        `Page ${previewState.currentPage} of ${part.pages}`;
    document.getElementById('currentPart').textContent = part.name;
}

// [Include remaining preview navigation functions]
