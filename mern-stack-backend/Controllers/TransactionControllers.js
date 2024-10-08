const axios = require("axios");
const Transaction = require("../model/Transaction");

const initializeDatabase = async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    let data = response.data;

    console.log(data);

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

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find();

    if (!transactions.length) {
      return res.json({ message: "No transactions found" });
    }

    res.send({
      message: "Transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error fetching transactions", error: error.message });
  }
};

const getStatistics = async (req, res) => {
  const { month, year } = req.query;

  if (
    !month ||
    isNaN(month) ||
    month < 1 ||
    month > 12 ||
    !year ||
    isNaN(year) ||
    year < 2000 ||
    year > new Date().getFullYear()
  ) {
    return res
      .status(400)
      .json({ message: "Valid month (1-12) and year are required" });
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

const getBarChartData = async (req, res) => {
  const { month, year } = req.query;

  if (
    !month ||
    isNaN(month) ||
    month < 1 ||
    month > 12 ||
    !year ||
    isNaN(year) ||
    year < 2000 ||
    year > new Date().getFullYear()
  ) {
    return res
      .status(400)
      .json({ message: "Valid month (1-12) and year are required" });
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
          boundaries: [
            0,
            100,
            200,
            300,
            400,
            500,
            600,
            700,
            800,
            900,
            Infinity,
          ],
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

const getCategoriesCount = async (req, res) => {
  const { month, year } = req.query;

  if (!month || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).send({ message: "Valid month (1-12) is required" });
  }

  if (!year || isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
    return res.status(400).send({ message: "Valid year is required" });
  }

  const monthNumber = parseInt(month);
  const yearNumber = parseInt(year);

  const startDate = new Date(yearNumber, monthNumber - 1, 1);
  const endDate = new Date(yearNumber, monthNumber, 1);

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

    const response = categoryData.map((item) => {
      if (item._id === "men's clothing") {
        return {
          category: "men's clothing",
          count: item.count,
        };
      } else {
        return {
          category: item._id,
          count: item.count,
        };
      }
    });

    res.send({
      message: "Category data fetched successfully",
      month,
      year,
      data: response,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error fetching category data", error: error.message });
  }
};
module.exports = {
  initializeDatabase,
  getAllTransactions,
  getStatistics,
  getBarChartData,
  getCategoriesCount,
};