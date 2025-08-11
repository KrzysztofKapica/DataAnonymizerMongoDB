# Data anonymizer

[About](#about-data-anonymizer)

[Installation](#installation)

[Usage](#usage)

[MongoDB database](#mongodb-database)

[Troubleshooting during development](#troubleshooting-during-development)

[Licence](#licence)


# About Data anonymizer

"Data anonymizer" is a locally run application, which uses metadata taken from MongoDB database, to anonymize certain areas of images containing sensitive information with black rectangles. The application seeks images on a disk based on information taken from the database. A user can see covered areas of images based on information from the database, or will be able to modify it by himself (delete old rectangles, draw new ones, or move old ones). After modifications new coordinates are sent to the database.

The [metadata](#mongodb-database) itself is genrated by a previously trained [neural network](https://github.com/KrzysztofKapica/PythonAIDetect) (in this case Faster Region Based Convolutional Neural Network), and it contains x and y coordinates, where is a possibility of presence of data to anonymize, and information about location of images on a disk. In this case the neural network was trained for seeking handwritten mailing addresses.

Thanks by REACT library the user has an access to the images through Chrome browser where can carry necessary modifications of images, and decide where to save them.


# Installation

To run this application on Linux you need to have installed:
- Node.js v18.20.2, or higher
- MongoDB - I used Docker for it
- Install REACT library in directory of the application
- Download this repository

Structure of the application should look like this:
```bash
RECOGNIZE-BACKEND
|
|-----node_modules (you'll get the modules after 'npm install')
|-----package-lock.json
|-----package.json
|-----server.js

RECOGNIZE-FRONTEND
|
|-----node-modules (you'll get the modules after 'npm install')
|
|-----src
|     |-----hooks
|     |     |-----useDirectoryPicker.jsx
|     |
|     |-----services
|     |     |-----saveImageFile.jsx
|     |     |-----updateImageData.jsx
|     |
|     |-----utils
|     |     |-----countScale.jsx
|     |     |-----drawCanvas.jsx
|     |     |-----drawRectangles.jsx
|     |     |-----roundRectangleCoordinates.jsx
|     |
|     |-----App.css
|     |-----App.jsx
|     |-----index.css
|     |-----main.jsx
|
|-----eslint.config.js
|-----index.html
|-----package-lock.json
|-----package.json
|-----README.md
|-----vite.config.js
```


# Usage 

- In Linux terminal go to 'RECOGNIZE-BACKEND' directory and type down **npm start**. This command will start a server side of the application.
- In Linux termianl go to 'RECOGNIZE-FRONTEND' directory and type down **npm run dev**. This command will sart a front-end side of the application. And you will be able to use the application in Chrome browser at http://localhost:PORT_OF_YOUR_CHOICE .

**IMPORTANT NOTE:** this application works properly only in Chrome browser!

![pic1](https://github.com/user-attachments/assets/3c9e82a5-6929-4762-a6e5-eec79b5df0c0)
Initial screen with main menu.

![pic2](https://github.com/user-attachments/assets/e0160252-67fc-49e2-8014-ed40044aef3d)
Interface where user can display images for modifications, and choose a folder to save modified images.

![pic3](https://github.com/user-attachments/assets/2af9d8df-ed85-49df-8ffb-185dddb6ab17)
By pressing 'space' on keyboard, holding down LMB, and dragging, the user can draw rectangles to anonymize data. Opacity of the rectangle is 0.5, after saving is 1. 

![pic4](https://github.com/user-attachments/assets/9c58272b-1763-4ffe-8a39-1581d7fd00aa)
After drawing the rectangle of desired size, and location, the user can still move it by clicking, holding LMB, and dragging it to desired place. Also it is possible to delete it - click, and hold LMB on desired rectangle, and press 'Backspace' on keyboard.

![pic5](https://github.com/user-attachments/assets/0c6b8450-b8fc-459e-86f6-54a5d5262292)
Final result of modified image.


# MongoDB database

Example of one document of metadata on MongoDB database:
```bash
  {
    "_id": "6715569eeecdefd4d8ab3df7",
    "object_id": 9,
    "image_path": "/path/to/folder/with/images/PL_11_FOK_399_2_15_0024.jpg",
    "to_do": "pending",
    "coordinates": [
      {
        "upper_left": {
          "x": 1305,
          "y": 232
        },
        "lower_right": {
          "x": 2284,
          "y": 775
        }
      }
    ]
  }
```

The application takes: 
- 'image path', and thanks to this the application is able to find it on a disk.
- 'coordinates' where the sensitive data can be. After the user's modifications this section is upgraded.
- After the user's modifications updates 'to_do' from 'pending' to 'done'. It helps to avoid browsing images, which were modified earlier.


# Troubleshooting during development

### Imported image was much bigger than a window of the browser 
This was caused by different dimensions of canvas, a layer where the user is conducting modifications, and dimensions of rendered image in the browser.
To fix this I had to get 'clientWidth', and 'clientHeight' properties from DOM (Document Object Model) elements. These are width, and height values of the image rendered in the browser:
```
const renderedWidth = image.clientWidth;
const renderedHeight = image.clientHeight;
```
And to properly overlay canvas on top of the image in the browser, I had to get exact width, and height dimensions of the image displayed in the browser. To do that I needed this code:
```
const canvasElement = canvasRef.current;
canvasElement.width = renderedWidth;
canvasElement.height = renderedHeight;
```
Thanks to these both, the image and the canvas, have the same size, and they fit in the window of the browser. And the browser can use a responsive design. 
Here is the whole function where the code from above was used:
```
  useEffect(() => {
    if (imageDataUrl && imageRecord && imageRef.current) {
      const image = imageRef.current;

      image.onload = () => {
        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;

        const renderedWidth = image.clientWidth;
        const renderedHeight = image.clientHeight;

        const scaleX = renderedWidth / naturalWidth;
        const scaleY = renderedHeight / naturalHeight;

        const canvasElement = canvasRef.current;
        canvasElement.width = renderedWidth;
        canvasElement.height = renderedHeight;

        const ctx = canvasElement.getContext('2d');

        drawCanvas(ctx, image, imageRecord.coordinates, scaleX, scaleY, renderedWidth, renderedHeight, 0.5); //0.5 opacity for viewing
      };

      image.src = imageDataUrl;
    }
  }, [imageDataUrl, imageRecord, drawCanvas]);
```

### Function to round values of rectangle coordinates
After modifications done by the user, the values of new coordinates had ten values after a dot. So I had to use 'floor' method from 'Math' object to cut off all values after the dot and make integer from it.
```
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
```

# Licence
This project is open source.
