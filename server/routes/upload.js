// server/routes/upload.js
const express = require('express');
const multer  = require('multer');
const path    = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req,file,cb)=>{
    cb(null, path.join(__dirname,'../../public/audio'));
  },
  filename: (_req,file,cb)=>{
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

router.put('/', upload.single('file'), (req,res)=>{
  if (!req.file) {
    return res.status(400).json({ error:'No file uploaded' });
  }
  res.json({ filename: req.file.filename });
});

module.exports = router;
