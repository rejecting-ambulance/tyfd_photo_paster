const input = document.getElementById('imageInput');
const container = document.getElementById('sheetContainer');
const downloadBtn = document.getElementById('downloadPdf');
const titleInput = document.getElementById('pdfTitleInput');

input.addEventListener('change', (e) => {
  container.innerHTML = '';
  const files = Array.from(e.target.files);

  for (let i = 0; i < files.length; i += 2) {
    const page = document.createElement('div');
    page.className = 'page';

    const title = document.createElement('div');
    title.className = 'page-title';
    title.textContent = titleInput.value || '照片黏貼表';
    page.appendChild(title);

    [0, 1].forEach(j => {
      if (files[i + j]) {
        const block = document.createElement('div');
        block.className = 'image-block';

        // 顯示圖片
        const img = document.createElement('img');
        img.src = URL.createObjectURL(files[i + j]);

        // 相片標籤
        const label = document.createElement('div');
        label.className = 'image-label';
        label.textContent = `相片 ${i + j + 1}`;

        // 說明區域
        const descriptionContainer = document.createElement('div');
        descriptionContainer.className = 'description-container';
        const descriptionLabel = document.createElement('label');
        descriptionLabel.textContent = '說明：';
        const textarea = document.createElement('textarea');
        textarea.rows = 2;
        textarea.placeholder = '請輸入說明';
        descriptionContainer.appendChild(descriptionLabel);
        descriptionContainer.appendChild(textarea);

        block.appendChild(img);
        block.appendChild(label);
        block.appendChild(descriptionContainer);
        page.appendChild(block);
      }
    });

    const footer = document.createElement('div');
    footer.className = 'page-footer';
    footer.textContent = `第 ${Math.floor(i / 2) + 1} 頁`;
    page.appendChild(footer);

    container.appendChild(page);
  }
});

downloadBtn.addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

  const pages = document.querySelectorAll('.page');

  for (let i = 0; i < pages.length; i++) {
    // 轉換 textarea 備註為 div
    const textareas = pages[i].querySelectorAll('textarea');
    textareas.forEach((ta) => {
      const span = document.createElement('div');
      span.textContent = ta.value;
      span.style.whiteSpace = 'pre-wrap';
      span.style.marginTop = '6px';
      span.style.fontSize = '22px';
      span.style.fontFamily = '"DFKai-SB", "BiauKai", serif';
      ta.replaceWith(span);
    });

    const canvas = await html2canvas(pages[i], { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  }

  const filename = titleInput.value?.trim() || '照片黏貼表';
  pdf.save(`${filename}.pdf`);
});
