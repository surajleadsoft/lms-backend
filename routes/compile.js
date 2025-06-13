const express = require('express');
const codeQueue = require('../jobQueue');
const router = express.Router();

router.post('/', async (req, res) => {
  const { language, code, input = "" } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: 'Missing code or language' });
  }

  const job = await codeQueue.add({ language, code, input });

  job.finished().then((result) => {
    res.json(result);
  }).catch((err) => {
    res.status(500).json({ error: 'Job execution failed', details: err.message });
  });
});

module.exports = router;
