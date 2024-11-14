import express from 'express';
import { MongoClient as _MongoClient } from 'mongodb';
import mongodb from 'mongodb';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
const MongoClient = mongodb.MongoClient;

const url = 'mongodb://localhost:27017';
const dbName = 'image_analysis';

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// Connect to MongoDB
let db;
MongoClient.connect(url, { useUnifiedTopology: true })
  .then((client) => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
  })
  .catch((error) => console.error('Failed to connect to MongoDB:', error));
   
// Endpoint to get image paths starting from a specific object_id
app.get('/api/image_by_object_id/:object_id', async (req, res) => {
  try {
    const collection = db.collection('object_detection');
    const objectIdValue = parseInt(req.params.object_id, 10);

    const imageRecord = await collection.findOne({ object_id: objectIdValue });
    
    if (!imageRecord) {
      console.error(`No image record found for object_id: ${objectIdValue}`);
      return res.status(404).send('Image record not found');
    }

    res.json({
      _id: imageRecord._id,
      object_id: imageRecord.object_id,
      image_path: imageRecord.image_path,
      to_do: imageRecord.to_do,
      coordinates: imageRecord.coordinates,
    });
  } catch (error) {
    console.error('Error fetching image record:', error);
    res.status(500).send('Error fetching image record');
  }
});

// Endpoint to serve the image from the disk based on image path
app.get('/api/image_by_path', (req, res) => {
  const imagePath = req.query.path;

  if (!imagePath) {
    return res.status(400).send('Image path is required');
  }

  const resolvedPath = path.resolve(imagePath);

  // Check if the file exists before serving
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found at path: ${resolvedPath}`);
    return res.status(404).send('Image file not found');
  }

  // Serve the image file from the disk
  res.sendFile(resolvedPath, { headers: { 'Content-Type': 'image/jpeg' } });
});

// Endpoint to get all object_ids with to_do: 'pending'
app.get('/api/pending_image_ids', async (req, res) => {
  try {
    const collection = db.collection('object_detection');
    const pendingImages = await collection
      .find({ to_do: 'pending' })
      .project({ object_id: 1 })
      .toArray();
    const pendingIds = pendingImages.map((img) => img.object_id);
    res.json(pendingIds);
  } catch (error) {
    console.error('Error fetching pending image IDs:', error);
    res.status(500).send('Error fetching pending image IDs');
  }
});

// Endpoint to get image record by image name
app.get('/api/image_by_name', async (req, res) => {
  try {
    const imageName = req.query.name;
    if (!imageName) {
      return res.status(400).send('Image name is required');
    }

    const collection = db.collection('object_detection');
    const imageRecord = await collection.findOne({ 'image_path': { $regex: imageName } });

    if (!imageRecord) {
      console.error(`No image record found for image name: ${imageName}`);
      return res.status(404).send('Image record not found');
    }

    res.json({
      _id: imageRecord._id,
      object_id: imageRecord.object_id,
      image_path: imageRecord.image_path,
      to_do: imageRecord.to_do,
      coordinates: imageRecord.coordinates,
    });
  } catch (error) {
    console.error('Error fetching image record by name:', error);
    res.status(500).send('Error fetching image record by name');
  }
});

// Endpoint to get all object_ids
app.get('/api/all_image_ids', async (req, res) => {
  try {
    const collection = db.collection('object_detection');
    const allImages = await collection
      .find({})
      .project({ object_id: 1 })
      .sort({ object_id: 1 })
      .toArray();
    const allIds = allImages.map((img) => img.object_id);
    res.json(allIds);
  } catch (error) {
    console.error('Error fetching all image IDs:', error);
    res.status(500).send('Error fetching all image IDs');
  }
});

// New endpoint to update image metadata
app.post('/api/update_image_metadata', async (req, res) => {
  try {
    const { object_id, to_do, coordinates } = req.body;

    if (typeof object_id !== 'number') {
      return res.status(400).send('Invalid object_id');
    }

    const collection = db.collection('object_detection');

    // Update the document with the new metadata
    const result = await collection.updateOne(
      { object_id: object_id },
      {
        $set: {
          to_do: to_do,
          coordinates: coordinates,
        },
      }
    );

    if (result.modifiedCount === 0) {
      console.error(`No document updated for object_id: ${object_id}`);
      return res.status(404).send('Document not found or not updated');
    }

    res.send('Metadata updated successfully');
  } catch (error) {
    console.error('Error updating image metadata:', error);
    res.status(500).send('Error updating image metadata');
  }
});

// Start the backend server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
