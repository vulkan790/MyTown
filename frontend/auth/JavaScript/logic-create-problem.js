document.addEventListener('DOMContentLoaded', function() {
  const fileUpload = document.getElementById('file-upload');
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'audio/wav', 'video/mp4'];
  const maxFiles = 5;
  let uploadedFiles = []; 
  
  if (fileUpload) 
  {
    fileUpload.addEventListener('change', function(e) {
      const newFiles = Array.from(this.files);
      const invalidFiles = [];
      const validFiles = [];
      
      newFiles.forEach(file => {
        if (allowedTypes.includes(file.type.toLowerCase()))
          validFiles.push(file);
        else
          invalidFiles.push(file.name);
      });
      
      if (uploadedFiles.length + validFiles.length > maxFiles) 
      {
        showFileError(`Максимальное количество файлов: ${maxFiles}. Удалите некоторые файлы перед добавлением новых.`);
        return;
      }
      
      uploadedFiles = [...uploadedFiles, ...validFiles];
      
      if (invalidFiles.length > 0)
        showFileError(`Неподдерживаемые форматы: ${invalidFiles.join(', ')}.`);
      
      updateFileList();
      this.value = ''; 
    });
  }

  function updateFileList() {
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';
    
    if (uploadedFiles.length > 0) 
    {
      const filesCounter = document.createElement('div');
      filesCounter.className = 'files-counter';
      filesCounter.textContent = `Файлов: ${uploadedFiles.length}/${maxFiles}`;
      fileList.appendChild(filesCounter);
      
      uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', () => removeFile(index));
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(deleteBtn);
        fileList.appendChild(fileItem);
      });
      
      if (uploadedFiles.length >= maxFiles)
        showFileError(`Достигнут лимит в ${maxFiles} файлов.`);
      else
        hideFileError();
    }
    else
      hideFileError();
  }

  function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateFileList();
  }

  function showFileError(message) {
    let errorElement = document.getElementById('file-error-message');
    
    if (!errorElement) 
    {
      errorElement = document.createElement('div');
      errorElement.id = 'file-error-message';
      errorElement.className = 'file-error';
      const uploadGroup = document.querySelector('.file-upload-group');
      uploadGroup.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  function hideFileError() {
    const errorElement = document.getElementById('file-error-message');
    if (errorElement)
      errorElement.style.display = 'none';
  }
});