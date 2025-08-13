const express = require('express');
const createError = require('http-errors');
const { connect } = require('../utils/db');
const Note = require('../models/Note');

const router = express.Router();
const { getServerSession } = require("next-auth");
const { authOptions } = require("../../src/lib/shared/authOptions"); // relative path

async function requireLogin(req, res, next) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.user = session.user;
  next();
}

router.use(requireLogin);

// GET /api/notes
router.get('/', async (req, res, next) => {
  try {
    await connect();
    const docs = await Note
      .find({ userId: req.user.id }) // ✅ using req.user.id now
      .sort({ updatedAt: -1 })
      .lean();

    const notes = docs.map(doc => ({
      id: doc._id.toString(),
      text: doc.text,
      audioUrls: doc.audioUrls,
      callerName: doc.callerName,
      callerEmail: doc.callerEmail,
      callerLocation: doc.callerLocation,
      callerAddress: doc.callerAddress,
      callReason: doc.callReason,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    res.json(notes);
  } catch (err) {
    next(err);
  }
});

// POST /api/notes
router.post('/', async (req, res, next) => {
  try {
    await connect();
    const note = await Note.create({
      userId: req.user.id, // ✅ updated
      ...req.body
    });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notes/:id
router.patch('/:id', async (req, res, next) => {
  try {
    await connect();
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, // ✅ updated
      req.body,
      { new: true }
    );
    if (!note) throw createError(404, 'Note not found');
    res.json(note);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await connect();
    const result = await Note.deleteOne({
      _id: req.params.id,
      userId: req.user.id // ✅ updated
    });
    if (result.deletedCount === 0) throw createError(404, 'Note not found');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
