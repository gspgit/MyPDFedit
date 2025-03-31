// Global state management
let previewState = {
    parts: [],
    currentPartIndex: 0,
    currentPage: 1,
    totalPages: 1,
    baseName: ""
};

// Helper functions
function getFileName(file) {
    return file.name.replace(/\.[^/.]+$/, "");
}

async function showPreview(parts, baseName) {
    previewState = {
        parts: await Promise.all(parts.map(async (bytes, index) => {
            const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
            return {
                bytes,
                name: `${baseName}_part${index + 1}.pdf`,
                totalPages: pdf.numPages
            };
        })),
        currentPartIndex: 0,
        currentPage: 1,
        totalPages: 1,
        baseName
    };
    
    await loadPartPreview(0);
    document.getElementById('previewModal').style.display = "block";
}

async function loadPartPreview(partIndex) {
    const part = previewState.parts[partIndex];
    previewState.currentPartIndex = partIndex;
    previewState.currentPage = 1;
    previewState.totalPages = part.totalPages;
    
    document.getElementById('currentPart').textContent = part.name;
    await renderCurrentPage();
    updateNavigationControls();
}

async function renderCurrentPage() {
    const part = previewState.parts[previewState.currentPartIndex];
    const pdf = await pdfjsLib.getDocument({ data: part.bytes }).promise;
    const page = await pdf.getPage(previewState.currentPage);
    
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    
    const preview = document.getElementById('pdfPreview');
    preview.innerHTML = "";
    preview.appendChild(canvas);
    
    document.getElementById('currentPage').textContent = 
        `Page ${previewState.currentPage} of ${previewState.totalPages}`;
}

function updateNavigationControls() {
    document.getElementById('prevPartBtn').disabled = previewState.currentPartIndex === 0;
    document.getElementById('nextPartBtn').disabled = 
        previewState.currentPartIndex === previewState.parts.length - 1;
}

// Navigation controls
function changePage(offset) {
    const newPage = previewState.currentPage + offset;
    if (newPage > 0 && newPage <= previewState.totalPages) {
        previewState.currentPage = newPage;
        renderCurrentPage();
    }
}

function changePart(offset) {
    const newIndex = previewState.currentPartIndex + offset;
    if (newIndex >= 0 && newIndex < previewState.parts.length) {
        loadPartPreview(newIndex);
    }
}

function downloadCurrentPart() {
    const part = previewState.parts[previewState.currentPartIndex];
    saveAs(new Blob([part.bytes], { type: 'application/pdf' }), part.name);
}

function closePreview() {
    document.getElementById('previewModal').style.display = "none";
    previewState.parts = [];
}

// PDF Processing Functions
async function mergePDFs() {
    try {
        const files = document.getElementById('mergeInput').files;
        if (files.length < 2) throw new Error('Please select at least 2 PDF files');
        
        const { PDFDocument } = PDFLib;
        const mergedPdf = await PDFDocument.create();
        const baseName = getFileName(files[0]);

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const pdf = await PDFDocument.load(bytes);
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
        }

        const mergedBytes = await mergedPdf.save();
        await showPreview([mergedBytes], baseName);
    } catch (err) {
        alert(`Error merging PDFs: ${err.message}`);
    }
}

async function splitPDF() {
    try {
        const file = document.getElementById('splitInput').files[0];
        const splitPage = parseInt(document.getElementById('splitPage').value);
        if (!file || isNaN(splitPage)) throw new Error('Invalid input');
        
        const { PDFDocument } = PDFLib;
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const pageCount = pdf.getPageCount();
        const baseName = getFileName(file);

        if (splitPage < 1 || splitPage >= pageCount) {
            throw new Error(`Please enter a page number between 1 and ${pageCount - 1}`);
        }

        const firstPart = await PDFDocument.create();
        const secondPart = await PDFDocument.create();
        
        const firstPages = await firstPart.copyPages(pdf, [...Array(splitPage).keys()]);
        const secondPages = await secondPart.copyPages(pdf, 
            [...Array(pageCount - splitPage).keys()].map(i => i + splitPage));
        
        firstPages.forEach(page => firstPart.addPage(page));
        secondPages.forEach(page => secondPart.addPage(page));
        
        const part1Bytes = await firstPart.save();
        const part2Bytes = await secondPart.save();
        
        await showPreview([part1Bytes, part2Bytes], baseName);
    } catch (err) {
        alert(`Error splitting PDF: ${err.message}`);
    }
}

async function rotatePDF() {
    try {
        const file = document.getElementById('rotateInput').files[0];
        const angle = parseInt(document.getElementById('rotateAngle').value);
        if (!file) throw new Error('Please select a PDF file');
        
        const { PDFDocument } = PDFLib;
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const baseName = getFileName(file);

        pdf.getPages().forEach(page => page.setRotation(angle));
        const rotatedBytes = await pdf.save();
        
        await showPreview([rotatedBytes], baseName);
    } catch (err) {
        alert(`Error rotating PDF: ${err.message}`);
    }
}

// Add other functions (watermark, compress, imageToPDF, extractText) following similar patterns

window.onload = () => {
    // Initialize any required components
};
