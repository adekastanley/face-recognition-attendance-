// import { faceapi } from "./face-api";

// export async function loadLabeledImages() {
// 	const labels = ["Stanley"];
// 	return Promise.all(
// 		labels.map(async (label) => {
// 			const descriptions = [];
// 			for (let i = 1; i <= 2; i++) {
// 				const img = await faceapi.fetchImage(
// 					`/labeled_images/${label}/${i}.jpg`
// 				);
// 				const detections = await faceapi
// 					.detectSingleFace(img)
// 					.withFaceLandmarks()
// 					.withFaceDescriptor();
// 				if (detections) {
// 					descriptions.push(detections.descriptor);
// 				}
// 			}
// 			return new faceapi.LabeledFaceDescriptors(label, descriptions);
// 		})
// 	);
// }
import { faceapi } from "./face-api";

export async function loadLabeledImages() {
	const labels = ["adeka stanley"]; // This must match the folder name in /public/labeled

	return Promise.all(
		labels.map(async (label) => {
			const descriptions = [];
			const img = await faceapi.fetchImage(`/known/${label}/stanley.jpg`);
			const detection = await faceapi
				.detectSingleFace(img)
				.withFaceLandmarks()
				.withFaceDescriptor();

			if (detection) {
				descriptions.push(detection.descriptor);
			}

			return new faceapi.LabeledFaceDescriptors(label, descriptions);
		})
	);
}
