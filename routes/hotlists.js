const express = require('express');
const router = express.Router();
const Hotlist = require('../models/Hotlist');

/**
 * @swagger
 * components:
 *   schemas:
 *     Hotlist:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the hotlist
 *         description:
 *           type: string
 *           description: Description of the hotlist
 *         candidates:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of candidate IDs
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date of creation
 */

/**
 * @swagger
 * /api/hotlists:
 *   get:
 *     summary: Returns all hotlists
 *     tags: [Hotlists]
 *     responses:
 *       200:
 *         description: List of all hotlists
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hotlist'
 */
router.get('/hotlists', async (req, res) => {
  try {
    const hotlists = await Hotlist.find().populate('candidates');
    res.json(hotlists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/hotlists/search:
 *   get:
 *     summary: Search hotlists
 *     tags: [Hotlists]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query string
 *     responses:
 *       200:
 *         description: List of matching hotlists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hotlist'
 */
router.get('/hotlists/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchQuery = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    };

    const hotlists = await Hotlist.find(searchQuery)
      .limit(10)
      .populate({
        path: 'candidates',
        select: 'name email technology'
      })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: hotlists
    });

  } catch (err) {
    console.error('Error searching hotlists:', err);
    res.status(500).json({
      success: false,
      message: 'Error searching hotlists',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/hotlist/{id}:
 *   get:
 *     summary: Get a hotlist by id
 *     tags: [Hotlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The hotlist id
 *     responses:
 *       200:
 *         description: The hotlist details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotlist'
 *       404:
 *         description: Hotlist not found
 */
router.get('/hotlist/:id', async (req, res) => {
  try {
    const hotlist = await Hotlist.findById(req.params.id).populate('candidates');
    if (!hotlist) {
      return res.status(404).json({ message: 'Hotlist not found' });
    }
    res.json(hotlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/hotlists:
 *   post:
 *     summary: Create a new hotlist
 *     tags: [Hotlists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               candidates:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: The created hotlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotlist'
 */
router.post('/hotlists', async (req, res) => {
  const hotlist = new Hotlist({
    name: req.body.name,
    description: req.body.description,
    candidates: req.body.candidates
  });

  try {
    const newHotlist = await hotlist.save();
    res.status(201).json(newHotlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});



module.exports = router; 