const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

/**
 * @swagger
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       required:
 *         - title
 *         - company
 *         - description
 *         - postedBy
 *       properties:
 *         title:
 *           type: string
 *           description: Job title
 *         company:
 *           type: string
 *           description: Company name
 *         location:
 *           type: string
 *           description: Job location
 *         description:
 *           type: string
 *           description: Job description
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *         salary:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *             currency:
 *               type: string
 *         type:
 *           type: string
 *           enum: [Full-time, Part-time, Contract, Freelance]
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [active, closed, draft]
 */

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Returns all jobs
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by job status
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *         description: Filter by job type
 *       - in: query
 *         name: experienceLevel
 *         schema:
 *           type: string
 *         description: Filter by experience level
 *       - in: query
 *         name: primaryTechnology
 *         schema:
 *           type: string
 *         description: Filter by primary technology
 *       - in: query
 *         name: remote
 *         schema:
 *           type: boolean
 *         description: Filter by remote status
 */
router.get('/jobs', async (req, res) => {
  try {
    const { 
      status, 
      jobType, 
      experienceLevel, 
      primaryTechnology, 
      remote,
      requiredSkills,
      location,
      search,
      page = 1,
      limit = 10
    } = req.query;
    
    // Build query object
    const query = {};

    // Add filters only if they are provided
    if (status) query.status = status;
    if (jobType) query.jobType = jobType;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (primaryTechnology) query.primaryTechnology = primaryTechnology;
    if (remote !== undefined) query.remote = remote === 'true';
    
    // Case-insensitive location search with partial matching
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Search in title, description, and company name
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Skills filter with case-insensitive matching
    if (requiredSkills) {
      const skillsArray = requiredSkills.split(',').map(skill => skill.trim());
      query.requiredSkills = { 
        $in: skillsArray.map(skill => new RegExp(skill, 'i'))
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const jobs = await Job.find(query)
      .sort({ postedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .lean(); // Convert to plain JavaScript objects

    // Get total count for pagination
    const total = await Job.countDocuments(query);

    // Add debug information in development
    const debug = process.env.NODE_ENV === 'development' ? {
      query,
      pagination: { page, limit, skip, total }
    } : null;

    // Send response
    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      },
      debug
    });

  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching jobs',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job details by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 */
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { 
        new: true,
        runValidators: true
      }
    ).select('-__v').lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });

  } catch (err) {
    console.error('Error fetching job:', err);
    
    // Handle invalid ID format
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching job details',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Job'
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 */
router.post('/jobs', async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      requirements,
      responsibilities,
      jobType,
      experienceLevel,
      location,
      remote,
      salary,
      primaryTechnology,
      requiredSkills,
      benefits,
      status,
      applicationDeadline
    } = req.body;

    const job = new Job({
      title,
      company,
      description,
      requirements: Array.isArray(requirements) ? requirements : requirements.split(',').map(req => req.trim()),
      responsibilities: Array.isArray(responsibilities) ? responsibilities : responsibilities.split(',').map(resp => resp.trim()),
      jobType,
      experienceLevel,
      location,
      remote,
      salary,
      primaryTechnology,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map(skill => skill.trim()),
      benefits: Array.isArray(benefits) ? benefits : benefits.split(',').map(benefit => benefit.trim()),
      status,
      applicationDeadline: new Date(applicationDeadline)
    });

    const newJob = await job.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Increment applications count
router.post('/jobs/:id/apply', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { applications: 1 } },
      { new: true }
    ).select('-__v');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 