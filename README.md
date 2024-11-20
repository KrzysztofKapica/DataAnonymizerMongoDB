# Data anonymizer

"Data anonymizer" is an locally run application, which uses metadata taken from MongoDB database, to anonymize certain areas of images containing sensitive information with black rectangles. The application seeks images on a disk based on information taken from the database. A user can see covered areas of images based on information from the database, or will be able to modify it by himself (delete old rectangles, draw new ones, or move old ones). After modifications new coordinates are sent to the database.

The [metadata](#mongodb-database) itself is genrated by a previously trained neural network, and it contains x and y coordinates, where is a possibility of presence of data to anonymize, and information about location of images on a disk. In this case the neural network was trained for seeking handwritten mailing addresses.

Thanks by REACT library the user has an access to the images through Chrome browser where can carry necessary modifications of images, and decide where to save them.


# Installation

To run this application on Linux you need to have installed:
- Node.js v18.20.2, or higher
- MongoDB - I used Docker for it
- Install REACT library in directory of the application
- Download this repository

Structure of the application should look like this:
```bash
DataAnonymizerMongoDB
|-----image-server
|     |-----node_modules (you'll get the modules after REACT installation)
|     |-----package-lock.json
|     |-----package.json
|     |-----server.js
|
|-----node-modules (you'll get the modules after REACT installation)
|
|-----public
|     |-----favicon.ico
|     |-----index.html
|     |-----logo1932.png
|     |-----logo512.png
|     |-----manifest.json
|     |-----robots.txt
|
|-----src
|     |-----App.css
|     |-----App.js
|     |-----App.test.js
|     |-----index.css
|     |-----logo.svg
|     |-----reportWebVitals.js
|     |-----setupTests.js
|
|-----package-lock.json
|-----package.json
|-----README.md
```


# Usage 

- In Linux terminal go to 'image-server' directory and type down **node server.js**. This command will start a server side of the application.
- In Linux termianl go to 'src' directory and type down **npm start**. This command will sart a front-end side of the application. And you will be able to use the application in Chrome browser at 'http://localhost:3000/' URL.

**IMPORTANT NOTE:** this application works properly only in Chrome browser!


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

Tutaj dac pare screenshotow z obslugi aplikacji. Kazdy screenshot powinien miec opis co sie na nim dzieje.


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
