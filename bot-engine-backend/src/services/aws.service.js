const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const bucketName = process.env.AWS_S3_BUCKET;

async function uploadImage(file, folderPath) {
    if (!file) return null;
    const fileExtension = file.originalname.split('.').pop();
    const randomName = crypto.randomBytes(16).toString('hex');
    const s3Key = `${folderPath}/${randomName}.${fileExtension}`;

    await s3Client.send(new PutObjectCommand({ 
        Bucket: bucketName, 
        Key: s3Key, 
        Body: file.buffer, 
        ContentType: file.mimetype 
    }));
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
}

async function deleteImage(imageUrl) {
    if (!imageUrl || !imageUrl.includes('.amazonaws.com/')) return;
    const s3Key = imageUrl.split('.amazonaws.com/')[1];
    if (s3Key) {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: s3Key })).catch(() => {});
    }
}

module.exports = { uploadImage, deleteImage };
