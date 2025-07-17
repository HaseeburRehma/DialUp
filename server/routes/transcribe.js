// server/routes/transcribe.js
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

router.post('/', (req, res, next) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Missing filename' });

  const ffmpegDir = path.dirname(path.resolve(__dirname, '../../server/utils/ffmpeg.exe'));
  const ffprobeDir = path.dirname(path.resolve(__dirname, '../../server/utils/ffprobe.exe'));
  const env = {
    ...process.env,
    PATH: [ffmpegDir, ffprobeDir, process.env.PATH].join(process.platform === 'win32' ? ';' : ':')
  };
  const script = path.resolve(__dirname, '../../server/utils/audiototext.py');
  const filePath = path.resolve(__dirname, '../../public/audio', filename);
  const py = spawn('python3', [script, filePath], { env });

  let out = '';
  py.stdout.on('data', d => out += d.toString());
  py.stderr.on('data', d => console.error(d.toString()));

  py.on('close', code => {
    if (code !== 0) return next(new Error('Transcription failed'));
    res.json({ transcript: out.trim() });
  });
});

module.exports = router;
