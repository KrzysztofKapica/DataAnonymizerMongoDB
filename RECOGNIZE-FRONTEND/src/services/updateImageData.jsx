import axios from 'axios';

export async function updateImageMetadataApi({
  object_id,
  coordinates,
  to_do = 'done',
}) {
  return axios.post('http://localhost:5000/api/update_image_metadata', {
    object_id,
    to_do,
    coordinates,
  });
}
