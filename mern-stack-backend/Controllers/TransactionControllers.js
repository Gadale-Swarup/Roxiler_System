const axios = require("axios");
const Transaction = require("../model/Transaction");

// Initialize the database with seed data
const initializeDatabase = async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    let data = response.data;

    data = data.map((item) => {
      if (item.dateOfSale) {
        const date = new Date(item.dateOfSale);
        item.year = date.getFullYear();
        item.month = date.getMonth() + 1;
      }
      return item;
    });

    await Transaction.deleteMany();
    await Transaction.insertMany(data);

    res.send({ message: "Database seeded successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error seeding database", error });
  }
};

// Get all transactions with pagination and optional search
const getAllTransactions = async (req, res) => {
  const { page = 1, perPage = 10, search = '' } = req.query;

  try {
    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { price: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(Number(perPage));

    const totalTransactions = await Transaction.countDocuments(query);

    res.json({
      message: "Transactions fetched successfully",
      total: totalTransactions,
      transactions,
      page,
      perPage,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error fetching transactions", error: error.message });
  }
};

// Get statistics for a selected month
const getStatistics = async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: "Month and year are required." });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  try {
    const [soldItemsCount, notSoldItemsCount] = await Promise.all([
      Transaction.countDocuments({
        dateOfSale: { $gte: startDate, $lt: endDate },
        sold: true,
      }),
      Transaction.countDocuments({
        dateOfSale: { $gte: startDate, $lt: endDate },
        sold: false,
      }),
    ]);

    const totalSalesResult = await Transaction.aggregate([
      { $match: { dateOfSale: { $gte: startDate, $lt: endDate }, sold: true } },
      { $group: { _id: null, totalAmount: { $sum: "$price" } } },
    ]);

    res.json({
      totalSalesAmount: totalSalesResult[0]?.totalAmount || 0,
      totalSoldItems: soldItemsCount,
      totalNotSoldItems: notSoldItemsCount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching statistics", error: error.message });
  }
};

// Bar chart data with price ranges
const getBarChartData = async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res
      .status(400)
      .json({ message: "Valid month (1-12) and year are required." });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  try {
    const priceRanges = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $bucket: {
          groupBy: "$price",
          boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, Infinity],
          default: "901-above",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    res.json(priceRanges);
  } catch (error) {
    res.status(500).json({ message: "Error generating bar chart", error });
  }
};

// Combined API that aggregates data from different APIs
const combined = async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: "Month and year are required." });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  try {
    const transactionsPromise = Transaction.find({
      dateOfSale: { $gte: startDate, $lt: endDate },
    }).limit(10);

    const statisticsPromise = Transaction.aggregate([
      {
        $facet: {
          totalSaleAmount: [
            { $match: { dateOfSale: { $gte: startDate, $lt: endDate }, sold: true } },
            { $group: { _id: null, total: { $sum: "$price" } } }
          ],
          totalSoldItems: [
            { $match: { dateOfSale: { $gte: startDate, $lt: endDate }, sold: true } },
            { $count: "soldCount" }
          ],
          totalNotSoldItems: [
            { $match: { dateOfSale: { $gte: startDate, $lt: endDate }, sold: false } },
            { $count: "notSoldCount" }
          ]
        }
      }
    ]);

    const barChartPromise = Transaction.aggregate([
      {
        $bucket: {
          groupBy: "$price",
          boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, Infinity],
          default: "901-above",
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    const pieChartPromise = Transaction.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const [transactions, statistics, barChart, pieChart] = await Promise.all([
      transactionsPromise,
      statisticsPromise,
      barChartPromise,
      pieChartPromise
    ]);

    res.json({
      transactions,
      statistics: {
        totalSaleAmount: statistics[0]?.totalSaleAmount[0]?.total || 0,
        totalSoldItems: statistics[0]?.totalSoldItems[0]?.soldCount || 0,
        totalNotSoldItems: statistics[0]?.totalNotSoldItems[0]?.notSoldCount || 0
      },
      barChart,
      pieChart
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching combined data", error });
  }
};

// Categories count based on month and year
const getCategoriesCount = async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).send({ message: "Valid month and year are required" });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  try {
    const categoryData = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    if (!categoryData.length) {
      return res.send({ message: "No transactions found for this month" });
    }

    const response = categoryData.map((item) => ({
      category: item._id,
      count: item.count,
    }));

    res.send({
      message: "Category data fetched successfully",
      month,
      year,
      data: response,
    });
  } catch (error) {
    res.status(500).send({ message: "Error fetching category data", error: error.message });
  }
};

module.exports = {
  initializeDatabase,
  getAllTransactions,
  getStatistics,
  getBarChartData,
  combined,
  getCategoriesCount
};
