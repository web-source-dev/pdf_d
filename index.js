import axios from 'axios';
import { mediaManager } from 'wix-media-backend';

const endpoint = 'https://pdf-d.onrender.com/';

export async function generatePDF(data, fileName) {
    if (!data || !fileName) {
        console.error('Invalid parameters: data and fileName are required');
        return null;
    }

    try {
        const buffer = await fetchPDFBuffer(data);
        if (!buffer) throw new Error('Failed to fetch PDF buffer');
        
        const uploadResult = await uploadPDF(buffer, fileName);
        console.log(`PDF uploaded successfully: ${uploadResult.fileUrl}`);
        return uploadResult;
    } catch (error) {
        console.error('Error in generatePDF:', error.stack);
        return null;
    }
}

async function fetchPDFBuffer(data) {
    try {
        const response = await axios.post(endpoint, data, { responseType: 'arraybuffer' });

        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Request failed with status:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching PDF buffer:', error.stack);
        return null;
    }
}

function uploadPDF(buffer, fileName) {
    return mediaManager.upload(
        '/myUploadFolder/subfolder',
        buffer,
        `${fileName}.pdf`,
        {
            mediaOptions: {
                mimeType: 'application/pdf',
                mediaType: 'document',
            },
            metadataOptions: {
                isPrivate: false,
                isVisitorUpload: false,
            },
        }
    );
}
