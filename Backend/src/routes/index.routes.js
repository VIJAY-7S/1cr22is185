const express = require('express');
const urlController = require('../controllers/url.controller.js');

const router = express.Router();

router.post('/shorturls', urlController.createShortUrl);
router.get('/shorturls/:shortcode', urlController.getShortUrlStats);
router.get('/:shortcode', urlController.redirectUrl);

module.exports = router;