# Data anonymizer

"Data anonymizer" is an locally run application, which uses metadata taken from MongoDB database, to anonymize certain areas of images containing sensitive information with black rectangles. The application seeks images on a disk based on information taken from the database. A user can see covered areas of images based on information from the database, or will be able to modify it by himself (delete old rectangles, draw new ones, or move old ones). After modifications new coordinates are sent to the database.

The metadata [metadata](#mongodb-database) itself is genrated by a previously trained neural network, and it contains x and y coordinates, where is a possibility of presence of data to anonymize, and information about location of images on a disk. In this case the neural network was trained for seeking handwritten mailing addresses.

Thanks by REACT library the user has an access to the images through Chrome browser where can carry necessary modifications of images, and decide where to save them.

# Installation

To run this application on Linux you need to have installed:
- Node.js v18.20.2, or higher
- MongoDB - I used Docker for it
- Install REACT library in directory of the application
- Upload this repository

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
- 'image path', and thanks to this is able to find it on a disk.
- 'coordinates' where the fragile data can be. After the user's modifications this section is upgraded.
- After the user's modifications updates 'to_do' from 'pending' to 'done'. That helps to avoid browsing images, which were modified earlier.

IMPORTANT NOTE:
This application runs well only on Chrome browser.

Tutaj dac pare screenshotow z obslugi aplikacji. Kazdy screenshot powinien miec opis co sie na nim dzieje.

# Troubleshooting duing development:
-opisac problem, kiedy wielkosc zdjecia rozjehala mi sie z wielkoscia canvas i nie mozna bylo rysowac
-jak zaokraglalem koordynaty nowych prostokatow

# Licence
This project is open source.





korzysta z danych wygenerowanych przez siec neuronowa; sama w sobie nie anonimizuje

 A React application that retrieves images metadata from a MongoDB database, including x and y coordinates of areas to anonymize. User can verify and modify images by adjusting these coordinates, masking sensitive regions with black rectangles for data anonymization. 





# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
