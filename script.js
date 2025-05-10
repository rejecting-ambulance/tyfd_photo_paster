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

        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';

        const img = document.createElement('img');
        const file = files[i + j];
        
        // 使用 FileReader 讀取圖片為 Base64
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;  // 將圖片設置為 Base64 格式

          // 確保圖片加載完成再執行排版
          img.onload = () => {
            URL.revokeObjectURL(img.src);  // 釋放內存
            updateMoveButtons();  // 當圖片加載完成後才更新按鈕
          };
        };
        reader.readAsDataURL(file);  // 讀取文件為 Base64

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '❌';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => {
          block.remove();
          cleanUpPages();
        };

        const upBtn = document.createElement('button');
        upBtn.textContent = '⬆️';
        upBtn.className = 'move-btn';
        upBtn.onclick = () => {
          const allBlocks = Array.from(document.querySelectorAll('.image-block'));
          const currentIndex = allBlocks.indexOf(block);
          if (currentIndex > 0) {
            const previousBlock = allBlocks[currentIndex - 1];
            previousBlock.parentNode.insertBefore(block, previousBlock);
            cleanUpPages();
          }
        };

        const downBtn = document.createElement('button');
        downBtn.textContent = '⬇️';
        downBtn.className = 'move-btn';
        downBtn.onclick = () => {
          const allBlocks = Array.from(document.querySelectorAll('.image-block'));
          const currentIndex = allBlocks.indexOf(block);
          if (currentIndex < allBlocks.length - 1) {
            const nextBlock = allBlocks[currentIndex + 1];
            nextBlock.parentNode.insertBefore(block, nextBlock.nextSibling);
            cleanUpPages();
          }
        };

        const btnGroup = document.createElement('div');
        btnGroup.className = 'button-group';
        btnGroup.appendChild(deleteBtn);
        btnGroup.appendChild(upBtn);
        btnGroup.appendChild(downBtn);

        wrapper.appendChild(img);
        wrapper.appendChild(btnGroup);
        block.appendChild(wrapper);

        const label = document.createElement('div');
        label.className = 'image-label';
        label.textContent = `相片 ${i + j + 1}`;
        block.appendChild(label);

        const descriptionContainer = document.createElement('div');
        descriptionContainer.className = 'description-container';
        const descriptionLabel = document.createElement('label');
        descriptionLabel.textContent = '說明：';
        const textarea = document.createElement('textarea');
        textarea.rows = 2;
        textarea.placeholder = '請輸入說明';
        descriptionContainer.appendChild(descriptionLabel);
        descriptionContainer.appendChild(textarea);
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


function cleanUpPages() {
  const blocks = Array.from(document.querySelectorAll('.image-block'));
  container.innerHTML = '';

  for (let i = 0; i < blocks.length; i += 2) {
    const page = document.createElement('div');
    page.className = 'page';

    const title = document.createElement('div');
    title.className = 'page-title';
    title.textContent = titleInput.value || '照片黏貼表';
    page.appendChild(title);

    for (let j = 0; j < 2; j++) {
      if (blocks[i + j]) {
        page.appendChild(blocks[i + j]);

        const indexInAll = i + j;
        const label = blocks[i + j].querySelector('.image-label');
        label.textContent = `相片 ${indexInAll + 1}`;
      }
    }

    const footer = document.createElement('div');
    footer.className = 'page-footer';
    footer.textContent = `第 ${Math.floor(i / 2) + 1} 頁`;
    page.appendChild(footer);

    container.appendChild(page);
  }
  updateMoveButtons();
}

function updateMoveButtons() {
  const blocks = Array.from(document.querySelectorAll('.image-block'));
  blocks.forEach((block, index) => {
    const upBtn = block.querySelector('.move-btn:nth-child(2)');
    const downBtn = block.querySelector('.move-btn:nth-child(3)');

    if (upBtn) upBtn.style.display = index === 0 ? 'none' : '';
    if (downBtn) downBtn.style.display = index === blocks.length - 1 ? 'none' : '';
  });
}

// 下載 PDF
downloadBtn.addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'px', format: 'a4' });
  const pages = document.querySelectorAll('.page');

  // 暫時隱藏控制按鈕
  pages.forEach(page => {
    page.querySelectorAll('.button-group').forEach(el => el.style.display = 'none');
  });

  // 將 textarea 替換成 div 顯示文字
  const textareas = document.querySelectorAll('textarea');
  const backups = [];

  textareas.forEach(textarea => {
    const div = document.createElement('div');
    div.textContent = textarea.value;
    div.className = 'textarea-print';
    div.style.whiteSpace = 'pre-wrap';

    backups.push({ textarea, div });
    textarea.style.display = 'none';
    textarea.parentNode.insertBefore(div, textarea);
  });

  // 開始逐頁截圖
  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    doc.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    if (i < pages.length - 1) {
      doc.addPage();
    }
  }

  // 還原 textarea
  backups.forEach(({ textarea, div }) => {
    div.remove();
    textarea.style.display = '';
  });

  // 還原按鈕
  pages.forEach(page => {
    page.querySelectorAll('.button-group').forEach(el => el.style.display = '');
  });

  const title = titleInput.value.trim() || '照片黏貼表';
  doc.save(`${title}.pdf`);
});

document.addEventListener('keydown', function (e) {
  const textareas = Array.from(document.querySelectorAll('textarea'));
  const currentIndex = textareas.indexOf(document.activeElement);

  if (e.key === 'Tab' && currentIndex !== -1) {
    e.preventDefault();

    let nextIndex;
    if (e.shiftKey) {
      // Shift + Tab → 上一個 textarea
      nextIndex = (currentIndex - 1 + textareas.length) % textareas.length;
    } else {
      // Tab → 下一個 textarea
      nextIndex = (currentIndex + 1) % textareas.length;
    }

    textareas[nextIndex].focus();
  }
});
