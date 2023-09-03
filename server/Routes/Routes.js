const express = require('express');
const router = express.Router();
const controller = require('../../Controllers/Controller');

router.post('/Register', controller.register);
router.post('/Login', controller.login); 
router.post('/SendOTP', controller.sendOTP); 
router.post('/VerifyOTP', controller.verifyOTP); 

module.exports = router;
