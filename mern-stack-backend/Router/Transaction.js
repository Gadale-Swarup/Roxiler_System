const express = require("express");
const transactioncontroller = require("../Controllers/TransactionControllers");
const router = express.Router();

router.get("/initializeDatabase", transactioncontroller.initializeDatabase);
router.get("/getAllTransactions", transactioncontroller.getAllTransactions);
router.get("/getStatistics", transactioncontroller.getStatistics);
router.get("/getBarChartData", transactioncontroller.getBarChartData);
router.get("/getCategoriesCount", transactioncontroller.getCategoriesCount);

module.exports = router;