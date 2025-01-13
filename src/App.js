import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

function App() {
  const [mode, setMode] = useState(null);
  const [imageNameInput, setImageNameInput] = useState('');
  const [pendingImageIds, setPendingImageIds] = useState([]);
  const [currentPendingIndex, setCurrentPendingIndex] = useState(0);
  const [allImageIds, setAllImageIds] = useState([]);
  const [currentAllIndex, setCurrentAllIndex] = useState(0);
  const [currentObjectId, setCurrentObjectId] = useState(null);
  const [imageRecord, setImageRecord] = useState(null);
  const [imagePath, setImagePath] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selectedRectangleIndex, setSelectedRectangleIndex] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drawingMode, setDrawingMode] = useState(false);
  const [newRectangle, setNewRectangle] = useState(null);
  const [lastFolderName, setLastFolderName] = useState('');
  const [directoryHandle, setDirectoryHandle] = useState(null);

  // Helper function to round rectangle coordinates to integers
  const roundRectangleCoordinates = (rect) => {
    return {
      upper_left: {
        x: Math.floor(rect.upper_left.x),
        y: Math.floor(rect.upper_left.y),
      },
      lower_right: {
        x: Math.floor(rect.lower_right.x),
        y: Math.floor(rect.lower_right.y),
      },
    };
  };

  // Helper function to count scale
  const countScale = (imgData) => {
    const image = imgData;
    if (!image) {
      console.log('No image metadata.');
    } 

    const scaleX = image.clientWidth / image.naturalWidth;
    const scaleY = image.clientHeight / image.naturalHeight;

    return {scaleX, scaleY};
  };

  // Function to prompt the user to select a directory
  const handleSelectDirectory = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      setDirectoryHandle(handle);
      alert(`Directory "${handle.name}" selected.`);
    } catch (error) {
      console.error('Directory selection canceled or failed:', error);
    }
  };

  // Function to fetch image records based on the mode
  const fetchImageRecord = async (objectId = null, imageName = '') => {
    setLoading(true);
    setError(null);
    try {
      let response;

      if (mode === 'pending') {
        if (pendingImageIds.length === 0) {
          // Fetch all pending image IDs
          const idsResponse = await axios.get('http://localhost:5000/api/pending_image_ids');
          setPendingImageIds(idsResponse.data);
          setCurrentPendingIndex(0);
          objectId = idsResponse.data[0];
        } else {
          objectId = pendingImageIds[currentPendingIndex];
        }
        response = await axios.get(`http://localhost:5000/api/image_by_object_id/${objectId}`);
      } else if (mode === 'byName') {
        response = await axios.get(`http://localhost:5000/api/image_by_name`, {
          params: { name: imageName },
        });
      } else if (mode === 'all') {
        if (allImageIds.length === 0) {
          // Fetch all image IDs
          const idsResponse = await axios.get('http://localhost:5000/api/all_image_ids');
          setAllImageIds(idsResponse.data);
          setCurrentAllIndex(0);
          objectId = idsResponse.data[0];
        } else {
          objectId = allImageIds[currentAllIndex];
        }
        response = await axios.get(`http://localhost:5000/api/image_by_object_id/${objectId}`);
      }

      // Initialize coordinates to an empty array, or empty array if it's null
      const imageRecordData = {
        ...response.data,
        coordinates: response.data.coordinates || [],
      };

      setImageRecord(imageRecordData);
      setCurrentObjectId(response.data.object_id);
      setImagePath(response.data.image_path);

      // Extract the last folder name from image_path
      const pathParts = response.data.image_path.split('/');
      const folderName = pathParts[pathParts.length - 2] || 'UnknownFolder';
      setLastFolderName(folderName);

      // Fetch the image file from the backend using the image path
      const imageResponse = await axios.get(`http://localhost:5000/api/image_by_path`, {
        params: {
          path: response.data.image_path,
        },
        responseType: 'blob',
      });

      // Create a URL for the image blob to display in the browser
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUrl(reader.result);
      };
      reader.readAsDataURL(imageResponse.data);
    } catch (error) {
      setImageRecord(null);
      setImagePath('');
      setImageDataUrl('');
      setError('No more images to process or an error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch image when mode changes or currentObjectId changes
  useEffect(() => {
    if (mode === 'pending' || mode === 'byName' || mode === 'all') {
      fetchImageRecord();
    }
  }, [mode, currentPendingIndex, currentAllIndex]);

  // Function to draw the entire canvas, including the image and the rectangles
  const drawCanvas = useCallback(
    (ctx, image, coordinates, scaleX, scaleY, width, height, opacity) => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      drawRectangles(ctx, coordinates, scaleX, scaleY, opacity);
      if (newRectangle) {
        const { upper_left, lower_right } = newRectangle;
        const x = upper_left.x * scaleX;
        const y = upper_left.y * scaleY;
        const rectWidth = (lower_right.x - upper_left.x) * scaleX;
        const rectHeight = (lower_right.y - upper_left.y) * scaleY;
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.fillRect(x, y, rectWidth, rectHeight);
      }
    }, [newRectangle]);  

  // Sync canvas size and draw rectangles when image loads
  useEffect(() => {
    if (imageDataUrl && imageRecord && imageRef.current) {
      const image = imageRef.current;

      image.onload = () => {
        const { scaleX, scaleY } = countScale(image);

        const canvasElement = canvasRef.current;
        canvasElement.width = image.clientWidth;
        canvasElement.height = image.clientHeight;
        
        // It provides API for drawing on canvas (getContext)
        const ctx = canvasElement.getContext('2d');

        // Draw the image and scaled rectangles on the canvas (view window)
        drawCanvas(ctx, image, imageRecord.coordinates, scaleX, scaleY, image.clientWidth, image.clientHeight, 0.5); //0.5 opacity for viewing
      };

      image.src = imageDataUrl;
    }
  }, [imageDataUrl, imageRecord, drawCanvas]);

  // Function to draw rectangles on the canvas
  const drawRectangles = (ctx, coordinates, scaleX, scaleY, opacity) => {
    if (coordinates && Array.isArray(coordinates) && coordinates.length > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      coordinates.forEach((rect) => {
        const { upper_left, lower_right } = rect;

        // Scale coordinates to match rendered image size
        const x = upper_left.x * scaleX;
        const y = upper_left.y * scaleY;
        const width = (lower_right.x - upper_left.x) * scaleX;
        const height = (lower_right.y - upper_left.y) * scaleY;

        ctx.fillRect(x, y, width, height);
      });
    }
  };

  // Mouse events for dragging rectangles, or drawing new ones
  const handleMouseDown = (e) => {
    if (!canvasRef.current || !imageRecord || !Array.isArray(imageRecord.coordinates)) return;

    const canvasElement = canvasRef.current;
    const rect = canvasElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { scaleX, scaleY } = countScale(imageRef.current);

    if (drawingMode) {
      // Start drawing a new rectangle
      setNewRectangle({
        upper_left: { x: mouseX / scaleX, y: mouseY / scaleY },
        lower_right: { x: mouseX / scaleX, y: mouseY / scaleY },
      });
    } else {
      // Check if mouse cursor is within any rectangle for dragging
      for (let i = 0; i < imageRecord.coordinates.length; i++) {
        const { upper_left, lower_right } = imageRecord.coordinates[i];

        // Scale coordinates to match rendered image size
        const x = upper_left.x * scaleX;
        const y = upper_left.y * scaleY;
        const width = (lower_right.x - upper_left.x) * scaleX;
        const height = (lower_right.y - upper_left.y) * scaleY;

        if (
          mouseX >= x &&
          mouseX <= x + width &&
          mouseY >= y &&
          mouseY <= y + height
        ) {
          setSelectedRectangleIndex(i);
          setDragging(true);
          setOffset({
            x: mouseX - x,
            y: mouseY - y,
          });
          canvasElement.style.cursor = 'grabbing';
          return;
        }
      }

      // If no rectangle is clicked, reset selection
      setSelectedRectangleIndex(null);
    }
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current || !imageRecord) return;

    const canvasElement = canvasRef.current;
    const rect = canvasElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { scaleX, scaleY } = countScale(imageRef.current);

    if (drawingMode && newRectangle) {
      // Update new rectangle dimensions
      setNewRectangle({
        ...newRectangle,
        lower_right: { x: mouseX / scaleX, y: mouseY / scaleY },
      });
    } else if (dragging && selectedRectangleIndex !== null && Array.isArray(imageRecord.coordinates)) {
      // Update the selected rectangle's position (adjusted for scaling)
      const newCoordinates = [...imageRecord.coordinates];
      const selectedRectangle = newCoordinates[selectedRectangleIndex];
      const rectWidth = selectedRectangle.lower_right.x - selectedRectangle.upper_left.x;
      const rectHeight = selectedRectangle.lower_right.y - selectedRectangle.upper_left.y;

      selectedRectangle.upper_left = {
        x: (mouseX - offset.x) / scaleX,
        y: (mouseY - offset.y) / scaleY,
      };
      selectedRectangle.lower_right = {
        x: selectedRectangle.upper_left.x + rectWidth,
        y: selectedRectangle.upper_left.y + rectHeight,
      };

      // Round the coordinates
      newCoordinates[selectedRectangleIndex] = roundRectangleCoordinates(selectedRectangle);

      setImageRecord({
        ...imageRecord,
        coordinates: newCoordinates,
      });
    }

    // Redraw the canvas
    const ctx = canvasElement.getContext('2d');
    const image = imageRef.current;
    drawCanvas(ctx, image, imageRecord.coordinates, scaleX, scaleY, canvasElement.width, canvasElement.height);
  };

  const handleMouseUp = useCallback(() => {
    if (drawingMode && newRectangle) {
      // Add the new rectangle to the coordinates list
      if (imageRecord && Array.isArray(imageRecord.coordinates)) {
        const roundedRectangle = roundRectangleCoordinates(newRectangle);        
        const newCoordinates = [...imageRecord.coordinates, roundedRectangle];
        setImageRecord({
          ...imageRecord,
          coordinates: newCoordinates,
        });
      }
      setNewRectangle(null);
      // Disable drawing mode after one rectangle is drawn
      setDrawingMode(false);
    }
    setDragging(false);
    setSelectedRectangleIndex(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
  },[  drawingMode,
    newRectangle,
    imageRecord,
    setImageRecord,
    setNewRectangle,
    setDrawingMode,
    setDragging,
    setSelectedRectangleIndex,
    canvasRef,]);

  // Function to send updated metadata to the server
  const updateImageMetadata = useCallback(async () => {
    try {
      // Ensure coordinates are integers before sending
      const roundedCoordinates = imageRecord.coordinates.map(roundRectangleCoordinates);

      const updatedData = {
        object_id: imageRecord.object_id,
        to_do: 'done',
        coordinates: roundedCoordinates,
      };

      await axios.post('http://localhost:5000/api/update_image_metadata', updatedData);

      console.log('Image metadata updated successfully.');
    } catch (error) {
      console.error('Failed to update image metadata:', error);
    }
  }, [imageRecord]);

  // Save the current state of the canvas as an image at original resolution
  const handleSaveImage = useCallback(async () => {
    if (imageRef.current && imageRecord && directoryHandle) {
      const image = imageRef.current;
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;

      // Create an off-screen canvas with the image's natural dimensions
      const fullSizeCanvas = document.createElement('canvas');
      fullSizeCanvas.width = naturalWidth;
      fullSizeCanvas.height = naturalHeight;
      const ctx = fullSizeCanvas.getContext('2d');

      // Draw the image and rectangles onto the off-screen canvas with opacity 1
      const scaleX = 1; // No scaling needed since we're at natural dimensions
      const scaleY = 1;
      drawCanvas(ctx, image, imageRecord.coordinates, scaleX, scaleY, naturalWidth, naturalHeight, 1); // 1 full opacity
  
      // Extract the file name from the image path
      const originalFileName = imagePath.split('/').pop();

      // Adjust the quality parameter to reduce file size
      const quality = 0.5; // Adjust this value between 0 and 1 as needed      

      // Get the last folder name from imagePath
      const pathParts = imagePath.split('/');
      const lastFolderName = pathParts[pathParts.length - 2] || 'UnknownFolder';

      // Create a subdirectory handle
      let subdirectoryHandle;
      try {
        subdirectoryHandle = await directoryHandle.getDirectoryHandle(
          lastFolderName,
          { create: true }
        );
      } catch (error) {
        console.error('Failed to get or create subdirectory:', error);
        return;
      }

      // Convert the canvas to a blob
      fullSizeCanvas.toBlob(
        async (blob) => {
          try {
            // Create a file handle in the subdirectory
            const fileHandle = await subdirectoryHandle.getFileHandle(
              originalFileName,
              { create: true }
            );
            // Create a writable stream
            const writable = await fileHandle.createWritable();
            // Write the blob to the file
            await writable.write(blob);
            await writable.close();
            alert(`File saved to ${lastFolderName}/${originalFileName}`);
            await updateImageMetadata(); // Send updated metadata to the server
          } catch (error) {
            console.error('Failed to save file:', error);
          }
        },
        'image/jpeg',
        quality
      );
    } else {
      alert('Please select a directory first.');
    }
  }, [
    imageRef,
    imageRecord,
    directoryHandle,
    drawCanvas,
    imagePath,
    updateImageMetadata,
  ]);

  const handleKeyDown = useCallback(
  (e) => {
    if (e.key === ' ') {
      e.preventDefault(); // Prevent the page from scrolling when 'space' is pressed
      if (!drawingMode) {
        // Enable drawing mode for a single rectangle
        setDrawingMode(true);
      }
    }

    if (e.key === 'ArrowRight') {
      // Move to the next image
      if (mode === 'pending' && pendingImageIds.length > 0) {
        setCurrentPendingIndex((prevIndex) =>
          Math.min(prevIndex + 1, pendingImageIds.length - 1)
        );
      } else if (mode === 'all' && allImageIds.length > 0) {
        setCurrentAllIndex((prevIndex) =>
          Math.min(prevIndex + 1, allImageIds.length - 1)
        );        
      }
    }

    if (e.key === 'ArrowLeft') {
      // Move to the previous image
      if (mode === 'pending' && pendingImageIds.length > 0) {
        setCurrentPendingIndex((prevIndex) => Math.max(prevIndex - 1, 0));
      } else if (mode === 'all' && allImageIds.length > 0) {
        setCurrentAllIndex((prevIndex) => Math.max(prevIndex - 1, 0));
      }      
    }

    if (e.key === 'Enter') {
      // Save the modified image
      handleSaveImage();
    }

    if (selectedRectangleIndex !== null && e.key === 'Backspace') {
      if (imageRecord && Array.isArray(imageRecord.coordinates)) {
        const newCoordinates = [...imageRecord.coordinates];
        newCoordinates.splice(selectedRectangleIndex, 1);
        setImageRecord({
          ...imageRecord,
          coordinates: newCoordinates,
        });

        // Redraw the canvas without the deleted rectangle
        const canvasElement = canvasRef.current;
        const ctx = canvasElement.getContext('2d');

        const { scaleX, scaleY } = countScale(imageRef.current);

        drawCanvas(ctx, imageRef.current, newCoordinates, scaleX, scaleY, canvasElement.width, canvasElement.height);

        // Reset the selected rectangle index
        setSelectedRectangleIndex(null);
      }
    }
  },[
    drawingMode,
    setDrawingMode,
    mode,
    pendingImageIds,
    setCurrentPendingIndex,
    allImageIds,
    setCurrentAllIndex,
    handleSaveImage,
    selectedRectangleIndex,
    imageRecord,
    setImageRecord,
    canvasRef,
    imageRef,
    drawCanvas,
    setSelectedRectangleIndex,
  ]);
  
  // Ensure the mouseup and keydown events are detected correctly
  useEffect(() => {
    const handleMouseUpDocument = () => {
      if (dragging || drawingMode) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleMouseUpDocument);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUpDocument);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dragging, drawingMode, handleMouseUp, handleKeyDown]);

  // Render logic based on mode
  if (mode === null) {
    // Display the initial options
    return (
      <div style={{ textAlign: 'center' }}>
        <h1>Data anonymizer</h1>
        <button onClick={() => setMode('pending')}>Display unfinished images</button>
        <button onClick={() => setMode('byName')}>Display image by its name</button>
        <button onClick={() => setMode('all')}>Display all images</button>
      </div>
    );
  }

  if (mode === 'byName' && !imageRecord) {
    // Display the input field for image name
    return (
      <div style={{ textAlign: 'center' }}>
        <h4>Right arrow - next image | Left arrow - previous image | Enter - save image | Backspace - delete a rectangle | Space - draw a new rectangle</h4>
        <input
          type="text"
          value={imageNameInput}
          onChange={(e) => setImageNameInput(e.target.value)}
          placeholder="Enter image name"
        />
        <button onClick={() => fetchImageRecord(null, imageNameInput)}>Load Image</button>
        {error && <p>{error}</p>}
        <button onClick={() => setMode(null)}>Menu</button>
      </div>
    );
  }

  if (mode === 'pending' || mode === 'all') {
    return (
      <div style={{ textAlign: 'center' }}>
        <h4>Right arrow - next image | Left arrow - previous image | Enter - save image | Backspace - delete a rectangle | Space - draw a new rectangle</h4>
        {loading ? (
          <p>Loading image record...</p>
        ) : error ? (
          <p>{error}</p>
        ) : imageRecord ? (
          <div>
            <p>Object ID: {imageRecord.object_id}</p>
            <p>Image Path: {imagePath}</p>
            {/* Display the button and selected directory name */}
            <div style={{ marginBottom: '10px' }}>
              <button onClick={handleSelectDirectory}>Select directory to save images</button>
              {directoryHandle && (
                <span style={{ marginLeft: '10px' }}>
                  Selected Directory: {directoryHandle.name}
                </span>
              )}
            </div>
            {/* Buttons in one row above the image */}
            <div
              style={{
                marginTop: '10px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {(mode === 'pending' || mode === 'all') && (
                <div>
                  <button
                    onClick={() => {
                      if (mode === 'pending') {
                        setCurrentPendingIndex((prevIndex) => Math.max(prevIndex - 1, 0));
                      } else if (mode === 'all') {
                        setCurrentAllIndex((prevIndex) => Math.max(prevIndex - 1, 0));
                      }
                    }}
                    disabled={
                      (mode === 'pending' && currentPendingIndex <= 0) ||
                      (mode === 'all' && currentAllIndex <= 0)
                    }
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      if (mode === 'pending') {
                        setCurrentPendingIndex((prevIndex) =>
                          Math.min(prevIndex + 1, pendingImageIds.length - 1)
                        );
                      } else if (mode === 'all') {
                        setCurrentAllIndex((prevIndex) =>
                          Math.min(prevIndex + 1, allImageIds.length - 1)
                        );
                      }
                    }}
                    disabled={
                      (mode === 'pending' && currentPendingIndex >= pendingImageIds.length - 1) ||
                      (mode === 'all' && currentAllIndex >= allImageIds.length - 1)
                    }
                    style={{ marginLeft: '10px' }}
                  >
                    Next
                  </button>
                </div>
              )}
              <button onClick={handleSaveImage} style={{ marginLeft: '10px' }}>
                Save Image
              </button>
              <button onClick={() => setMode(null)} style={{ marginLeft: '10px' }}>
                Menu
              </button>
            </div>
            {/* Image and canvas with left and right margins */}
            <div
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '70%', // Image width (100% - left and right margins)
                marginLeft: '15%',
                marginRight: '15%',
              }}
            >
              {imageDataUrl && (
                <div>
                  {/* Image element */}
                  <img
                    ref={imageRef}
                    src={imageDataUrl}
                    alt={`Object ID ${imageRecord.object_id}`}
                    style={{ display: 'block', width: '100%' }}
                  />
                  {/* Canvas element for drawing and interacting with rectangles */}
                  <canvas
                    ref={canvasRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      pointerEvents: 'all',
                      cursor: dragging
                        ? 'grabbing'
                        : drawingMode
                        ? 'crosshair'
                        : 'grab',
                      width: '100%', // Ensure canvas matches image width
                      height: '100%', // Ensure canvas matches image height
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <p>No image record found.</p>
        )}
      </div>
    );
  }  
}

export default App;