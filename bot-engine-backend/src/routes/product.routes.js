const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (JPEG, PNG, WEBP).'), false);
    }
};
const upload = multer({ 
    storage: multer.memoryStorage(), 
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: fileFilter
});
const productController = require('../controllers/product.controller');

router.get('/:tenant_id', productController.getProducts);
router.post('/', upload.single('image'), productController.createProduct);
router.put('/:id', upload.single('image'), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
