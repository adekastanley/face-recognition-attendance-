// Dynamic import for client-side only
export const loadFaceApi = async () => {
  if (typeof window === 'undefined') {
    throw new Error('face-api can only be loaded on the client side');
  }
  const faceapi = await import('@vladmandic/face-api');
  return faceapi;
};

// Re-export for convenience - will be undefined on server
let faceapi: any;
if (typeof window !== 'undefined') {
  loadFaceApi().then(api => {
    faceapi = api;
  });
}

export { faceapi };

let modelsLoaded = false;

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  
  if (!faceapi) {
    const api = await loadFaceApi();
    faceapi = api;
  }

  const MODEL_URL = "/models"; // Because models are in /public/models

  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);

  modelsLoaded = true;
}
