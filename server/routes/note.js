// server/routes/note.js
const express = require('express');
const createError = require('http-errors');
const { connect } = require('../utils/db');
const Note = require('../models/Note');

const router = express.Router();

function requireLogin(req,res,next) {
  if (!req.session.user) return next(createError(401,'Not authenticated'));
  next();
}

router.use(requireLogin);

// GET /api/notes
// GET /api/notes
router.get('/', async (req, res, next) => {
  try {
    await connect();
    const docs = await Note
      .find({ userId: req.session.user.id })
      .sort({ updatedAt: -1 })
      .lean();   // returns plain objects

    const notes = docs.map(doc => ({
      id:            doc._id.toString(),  // ← convert _id into id
      text:          doc.text,
      audioUrls:     doc.audioUrls,
      callerName:    doc.callerName,
      callerEmail:   doc.callerEmail,
      callerLocation:doc.callerLocation,
      callerAddress: doc.callerAddress,
      callReason:    doc.callReason,
      createdAt:     doc.createdAt,
      updatedAt:     doc.updatedAt,
    }));

    res.json(notes);
  } catch(err) {
    next(err);
  }
});


// POST /api/notes
router.post('/', async (req,res,next) => {
  try {
    await connect();
    const note = await Note.create({
      userId: req.session.user.id,
      ...req.body
    });
    res.status(201).json(note);
  } catch(err) {
    next(err);
  }
});

// PATCH /api/notes/:id
router.patch('/:id', async (req,res,next) => {
  try {
    await connect();
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user.id },
      req.body,
      { new: true }
    );
    if (!note) throw createError(404,'Note not found');
    res.json(note);
  } catch(err) {
    next(err);
  }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req,res,next) => {
  try {
    await connect();
    const result = await Note.deleteOne({
      _id: req.params.id,
      userId: req.session.user.id
    });
    if (result.deletedCount === 0) throw createError(404,'Note not found');
    res.json({ success: true });
  } catch(err) {
    next(err);
  }
});

module.exports = router;
