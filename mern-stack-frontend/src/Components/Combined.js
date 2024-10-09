import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import './Combined.css'; // Custom CSS file

const Dashboard = () => {
  const [data, setData] = useState(null); // Holds the combined data
  const [month, setMonth] = useState(3); // Default month is March
  const [year, setYear] = useState(2022); // Default year is 2022
  const [loading, setLoading] = useState(true); // To show loading state
  const [search, setSearch] = useState(""); // Holds search term

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Start loading state
        const response = await axios.get(`http://localhost:5001/api/transaction/combined?month=${month}&year=${year}`);
        setData(response.data);
        setLoading(false); // Stop loading state
      } catch (error) {
        console.error("Error fetching combined data", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [month, year]);

  // Handle month change from dropdown
  const handleMonthChange = (e) => {
    setMonth(e.target.value);
  };

  // Handle year change from dropdown
  const handleYearChange = (e) => {
    setYear(e.target.value);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Dashboard</h1>
      <div className="row mb-4">
        <div className="col-md-6">
          <select className="form-select" value={year} onChange={handleYearChange}>
            <option value={2021}>2021</option>
            <option value={2022}>2022</option>
          </select>
        </div>
        <div className="col-md-6">
          <select className="form-select" value={month} onChange={handleMonthChange}>
            {[...Array(12).keys()].map((m) => (
              <option key={m + 1} value={m + 1}>
                {new Date(0, m).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Input */}
      {/* <div className="mb-4">
        <input
          type="text"
          placeholder="Search transactions..."
          className="form-control"
          value={search}
          onChange={handleSearchChange}
        />
      </div> */}

      {/* Transactions Table */}
      <h2>Transactions</h2>
      <table className="table table-bordered mb-4 shadow-sm">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
            <th>Sold</th>
          </tr>
        </thead>
        <tbody>
          {data.transactions.map((transaction) => (
            <tr key={transaction._id}>
              <td>{transaction.title}</td>
              <td>{transaction.description}</td>
              <td>${transaction.price}</td>
              <td>{transaction.sold ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Statistics */}
      <h2>Statistics</h2>
      <div className="mb-4 shadow-sm p-3 rounded">
        <p>Total Sale Amount: <strong>${data.statistics.totalSaleAmount}</strong></p>
        <p>Total Sold Items: <strong>{data.statistics.totalSoldItems}</strong></p>
        <p>Total Not Sold Items: <strong>{data.statistics.totalNotSoldItems}</strong></p>
      </div>

      {/* Charts Container */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <h2>Price Range Distribution</h2>
          <div className="shadow-sm p-3 rounded">
            <Bar
              data={{
                labels: ["0-100", "101-200", "201-300", "301-400", "401-500", "501-600", "601-700", "701-800", "801-900", "901+"],
                datasets: [
                  {
                    label: "Items in Price Range",
                    data: data.barChart.map((range) => range.count),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                  }
                ]
              }}
              options={{
                maintainAspectRatio: true, // Makes the chart responsive
              }}
              height={250} // Adjust the height to make it smaller
            />
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <h2>Category Distribution</h2>
          <div className="shadow-sm p-3 rounded">
            <Pie
              data={{
                labels: data.pieChart.map((category) => category._id),
                datasets: [
                  {
                    data: data.pieChart.map((category) => category.count),
                    backgroundColor: [
                      "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
                      "#FF9F40", "#36A2EB", "#FF6384", "#FFCE56", "#4BC0C0"
                    ],
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Category Distribution',
                  },
                },
              }}
              height={250} // Adjust the height to make it smaller
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
