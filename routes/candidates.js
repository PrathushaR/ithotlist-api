const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const upload = require('../config/upload');
const fs = require('fs');

/**
 * @swagger
 * components:
 *   schemas:
 *     Candidate:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the candidate
 *         email:
 *           type: string
 *           description: The email of the candidate
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: List of candidate's skills
 *         experience:
 *           type: number
 *           description: Years of experience
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date of creation
 */

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Returns all candidates
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: List of all candidates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Candidate'
 */
router.get('/candidates', async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * @swagger
 * /api/candidates/search:
 *   get:
 *     summary: Search candidates
 *     tags: [Candidates]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query string
 *     responses:
 *       200:
 *         description: List of matching candidates
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
 *                     $ref: '#/components/schemas/Candidate'
 */
router.get('/candidates/search', async (req, res) => {
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
        { email: { $regex: q, $options: 'i' } },
        { technology: { $regex: q, $options: 'i' } },
        { skills: { $regex: q, $options: 'i' } }
      ]
    };

    const candidates = await Candidate.find(searchQuery)
      .limit(10)
      .select('-resumeFile')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: candidates
    });

  } catch (err) {
    console.error('Error searching candidates:', err);
    res.status(500).json({
      success: false,
      message: 'Error searching candidates',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/candidates/{id}:
 *   get:
 *     summary: Get a candidate by id
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The candidate id
 *     responses:
 *       200:
 *         description: The candidate details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       404:
 *         description: Candidate not found
 */
router.get('/candidates/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/candidate:
 *   post:
 *     summary: Create a new candidate
 *     tags: [Candidates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               experience:
 *                 type: number
 *     responses:
 *       201:
 *         description: The created candidate
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 */
router.post('/candidate', async (req, res) => {
  const candidate = new Candidate({
    name: req.body.name,
    email: req.body.email,
    skills: req.body.skills,
    experience: req.body.experience
  });

  try {
    const newCandidate = await candidate.save();
    res.status(201).json(newCandidate);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/candidate/with-resume:
 *   post:
 *     summary: Create a new candidate with resume
 *     tags: [Candidates]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: resumeFile
 *         type: file
 *         description: Candidate's resume (PDF or DOC)
 *       - in: formData
 *         name: name
 *         type: string
 *         required: true
 *         description: The name of the candidate
 *       - in: formData
 *         name: email
 *         type: string
 *         required: true
 *         description: The email of the candidate
 *       - in: formData
 *         name: yearsOfExp
 *         type: number
 *         required: true
 *         description: Years of experience
 *       - in: formData
 *         name: technology
 *         type: string
 *         required: true
 *         description: Primary technology
 *       - in: formData
 *         name: skills
 *         type: array
 *         items:
 *           type: string
 *         description: List of candidate's skills
 *       - in: formData
 *         name: experience
 *         type: number
 *         description: Years of experience (legacy field)
 *       - in: formData
 *         name: avatar
 *         type: string
 *         description: Avatar URL
 *     responses:
 *       201:
 *         description: The created candidate
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       400:
 *         description: Invalid input or file type
 */
router.post('/candidate/with-resume', upload.single('resumeFile'), async (req, res) => {
  try {
    const { 
      name, 
      email,
      yearsOfExp, 
      technology, 
      skills, 
      experience,
      avatar,
      status 
    } = req.body;

    // Convert skills from string to array if it comes as comma-separated string
    const skillsArray = typeof skills === 'string' ? 
      skills.split(',').map(skill => skill.trim()).filter(Boolean) : 
      skills || undefined; // undefined will trigger the default empty array

    const candidate = new Candidate({
      name,  // required
      email, // required
      yearsOfExp: yearsOfExp ? Number(yearsOfExp) : undefined,
      technology,
      skills: skillsArray,
      experience: experience ? Number(experience) : undefined,
      avatar,
      status,
      resumeFile: req.file ? {
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype
      } : undefined
    });

    const newCandidate = await candidate.save();
    res.status(201).json(newCandidate);
  } catch (err) {
    // Clean up uploaded file if save fails
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    }
    res.status(400).json({ message: err.message });
  }
});


module.exports = router; 