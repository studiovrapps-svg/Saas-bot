const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaign.controller');

router.post('/:id/campaigns/send', campaignController.sendCampaign);

module.exports = router;
