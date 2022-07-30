const express = require('express');
const router = express.Router();
const Controller = require('../controllers/upload');
const controller = new Controller();

router.post('/verify', async(req, res)=>{
    // res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    await controller.handleVerifyUpload(req, res);
})

router.post('/merge', async(req, res)=>{
    // res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    await controller.handleMerge(req, res);
})

router.post("/", async(req, res)=> {
    await controller.handleFormData(req, res);
})


router.post("/delete", async(req, res)=> {
    await controller.deleteFiles(req, res);
})
  

module.exports = router;