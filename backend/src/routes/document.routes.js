const express = require("express");
const router = express.Router();
const multer = require("multer");
const documentController = require("../controllers/document.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Configure Multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.use(authMiddleware);

router.post("/upload", upload.single("file"), documentController.uploadDocument);
router.get("/", documentController.getDocuments);
router.delete("/:id", documentController.deleteDocument);

module.exports = router;
