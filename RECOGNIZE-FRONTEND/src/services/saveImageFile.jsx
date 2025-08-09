/**
 * Save a canvas snapshot of an image + rectangles, then call the back-end.
 * @param {HTMLImageElement} imgRef
 * @param {Object[]} rectangles full-resolution coords
 * @param {import('browser-fs-access').DirectoryHandle} dirHandle
 * @param {string} imagePath absolute path from DB (only to get filename)
 * @param {Function} notifyBackend a function that updates Mongo
 */
export async function saveImageFile(
    imgRef,
    rectangles,
    dirHandle,
    imagePath,
    notifyBackend
  ) {
    // 1. Build a full-size canvas
    const { naturalWidth: w, naturalHeight: h } = imgRef;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgRef, 0, 0, w, h);
  
    // 2. Overlay black rectangles
    ctx.fillStyle = 'black';
    rectangles.forEach(({ upper_left, lower_right }) => {
      ctx.fillRect(
        upper_left.x,
        upper_left.y,
        lower_right.x - upper_left.x,
        lower_right.y - upper_left.y
      );
    });
  
    // 3. Get target sub-directory
    const parts = imagePath.split('/');
    const fileName = parts.pop();           // xyz.jpg
    const folder   = parts.pop() ?? '';     // last folder name
    const subDir = await dirHandle.getDirectoryHandle(folder, { create: true });
  
    // 4. Convert to JPEG blob
    const blob = await new Promise((res) =>
      canvas.toBlob(res, 'image/jpeg', 0.5) // quality 50 %
    );
  
    // 5. Write file
    const fileHandle = await subDir.getFileHandle(fileName, { create: true });
    const stream = await fileHandle.createWritable();
    await stream.write(blob);
    await stream.close();
  
    // 6. Notify back-end
    await notifyBackend();
  }
  