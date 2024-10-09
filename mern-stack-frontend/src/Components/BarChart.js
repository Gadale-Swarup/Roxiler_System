import React, { useEffect, useState, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js"; 
import axios from "axios";
import "./BarChart.css";  // Ensure this is properly linked

Chart.register(...registerables);

const BarChartComponent = ({ selectedMonth, selectedYear }) => {
  const [chartData, setChartData] = useState([]);

  const fetchBarChartData = useCallback(async () => {
    try {
      const monthIndex =
        new Date(Date.parse(selectedMonth + " 1, 2020")).getMonth() + 1;
      console.log(
        `Fetching data for month: ${monthIndex}, year: ${selectedYear}`
      );

      const response = await axios.get(
        `http://localhost:5001/api/transaction/getBarChartData?month=${monthIndex}&year=${selectedYear}`
      );

      if (response.status === 200) {
        setChartData(response.data); 
      } else {
        console.error("Failed to fetch data:", response.data);
        setChartData([]); 
      }
    } catch (error) {
      console.error(
        "Error fetching bar chart data:",
        error.response ? error.response.data : error.message
      );
      setChartData([]);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchBarChartData(); 
    }
  }, [fetchBarChartData]);

  const data = {
    labels: [
      "0 - 100",
      "101 - 200",
      "201 - 300",
      "301 - 400",
      "401 - 500",
      "501 - 600",
      "601 - 700",
      "701 - 800",
      "801 - 900",
      "901-above",
    ],
    datasets: [
      {
        label: "Number of Items",
        data: chartData.map((range) => range.count || 0),
        backgroundColor: "rgba(75, 192, 192, 0.6)", 
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // To control the chart size based on the container
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
  };

  return (
    <div className="barchart-container">
      <h3 className="chart-title">
        Bar Chart for {selectedMonth} {selectedYear}
      </h3>
      <div className="barchart-wrapper">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default BarChartComponent;
