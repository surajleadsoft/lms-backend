const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

async function removeDuplicateApplications() {
  try {
    // Step 1: Find all duplicates grouped by unique fields
    const duplicates = await Application.aggregate([
      {
        $group: {
          _id: {
            emailAddress: "$emailAddress",
            companyName: "$companyName",
            driveName: "$driveName",
            position: "$position"
          },
          ids: { $push: "$_id" },
          latestId: { $last: "$_id" }, // keep the latest one
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 } // only duplicates
        }
      }
    ]);

    // Step 2: Collect IDs to delete
    const idsToDelete = duplicates.flatMap(doc => {
      const { ids, latestId } = doc;
      return ids.filter(id => id.toString() !== latestId.toString());
    });

    // Step 3: Delete the duplicates
    const result = await Application.deleteMany({ _id: { $in: idsToDelete } });

    console.log(`${result.deletedCount} duplicate applications deleted.`);
  } catch (error) {
    console.error('Error deleting duplicates:', error.message);
  }
}

// removeDuplicateApplications();

// Insert new application
router.post('/add', async (req, res) => {
  try {
    const { emailAddress, companyName, driveName, position, appliedDate, appliedTime } = req.body;

    const filter = { emailAddress, companyName, driveName, position };
    const update = { appliedDate, appliedTime };
    const options = { upsert: true, new: true }; // create if not exists, return updated doc

    const result = await Application.findOneAndUpdate(filter, update, options);

    const isNew = result.createdAt && result.updatedAt && result.createdAt.getTime() === result.updatedAt.getTime();

    res.json({
      status: true,
      message: isNew ? 'Applied successfully !!' : 'Application updated successfully !!'
    });
  } catch (error) {
    console.error(error);
    res.json({ status: false, error: error.message });
  }
});

// Get all applications
router.get('/all', async (req, res) => {
  try {
    const applications = await Application.find();
    res.json({status:true,data:applications});
  } catch (error) {
    res.json({status:false, error: error.message });
  }
});

// Get by emailAddress
router.get('/email/:emailAddress', async (req, res) => {
  try {
    const result = await Application.find({ emailAddress: req.params.emailAddress }).sort({appliedDate:-1});
    res.json({status:true,data:result});
  } catch (error) {
    res.json({status:false, error: error.message });
  }
});



// Get by campusName and position
router.get('/filter', async (req, res) => {
  const { campusName, position } = req.query;
  try {
    const result = await Application.find({ campusName, position });
    res.json({status:true,data:result});
  } catch (error) {
    res.json({status:false, error: error.message });
  }
});

module.exports = router;
