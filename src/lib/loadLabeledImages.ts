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

// Helper function to get all person folders
async function getPersonFolders(): Promise<string[]> {
	try {
		// For now, we'll use a fixed list since we can't easily read directory contents from the browser
		// This could be improved by having an API endpoint that returns the list of available people
		const response = await fetch('/api/people');
		if (response.ok) {
			const data = await response.json();
			return data.people || [];
		}
	} catch (error) {
		console.warn('Could not fetch people list, using fallback:', error);
	}

	// Fallback to known people - you can add more names here
	return ["adeka stanley"];
}

// Helper function to get all images for a person
async function getPersonImages(personName: string): Promise<string[]> {
	try {
		// Try to fetch metadata first
		const metadataResponse = await fetch(`/known/${personName}/metadata.json`);
		if (metadataResponse.ok) {
			const metadata = await metadataResponse.json();
			return metadata.images?.map((img: any) => `/known/${personName}/${img.filename}`) || [];
		}
	} catch (error) {
		console.warn(`Could not load metadata for ${personName}:`, error);
	}

	// Fallback: try common image names
	const commonNames = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', 'stanley.jpg'];
	const validImages = [];

	for (const imageName of commonNames) {
		try {
			const imageUrl = `/known/${personName}/${imageName}`;
			const response = await fetch(imageUrl, { method: 'HEAD' });
			if (response.ok) {
				validImages.push(imageUrl);
			}
		} catch (error) {
			// Image doesn't exist, continue
		}
	}

	return validImages;
}

export async function loadLabeledImages() {
	const labels = await getPersonFolders();
	console.log('Loading faces for:', labels);

	return Promise.all(
		labels.map(async (label) => {
			const descriptions = [];
			const imageUrls = await getPersonImages(label);

			console.log(`Loading ${imageUrls.length} images for ${label}`);

			for (const imageUrl of imageUrls) {
				try {
					const img = await faceapi.fetchImage(imageUrl);
					const detection = await faceapi
						.detectSingleFace(img)
						.withFaceLandmarks()
						.withFaceDescriptor();

					if (detection) {
						descriptions.push(detection.descriptor);
						console.log(`✓ Loaded face descriptor from ${imageUrl}`);
					} else {
						console.warn(`✗ Could not detect face in ${imageUrl}`);
					}
				} catch (error) {
					console.error(`Error loading image ${imageUrl}:`, error);
				}
			}

			if (descriptions.length === 0) {
				console.warn(`No valid face descriptors found for ${label}`);
				return null;
			}

			console.log(`✓ Successfully loaded ${descriptions.length} face descriptors for ${label}`);
			return new faceapi.LabeledFaceDescriptors(label, descriptions);
		})
	).then(results => results.filter(result => result !== null));
}
