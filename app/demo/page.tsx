'use client'

import React from "react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function ComplexGanttChart() {
  // Task data
  const tasks = [
    { name: "1.1 Wireframes (Joe)", start: 0, duration: 3 },
    { name: "1.2 Mockups (Joe)", start: 3, duration: 5 },
    { name: "1.3 Finalize Design (Joe)", start: 8, duration: 2 },
    { name: "2.1 Setup Project (Mark)", start: 10, duration: 2 },
    { name: "2.2 Responsive Layout (Mark)", start: 12, duration: 5 },
    { name: "2.3 Integrate Design (Mark)", start: 17, duration: 3 },
    { name: "3.1 Setup Server (John)", start: 10, duration: 4 },
    { name: "3.2 Build API (John)", start: 14, duration: 6 },
    { name: "3.3 Integrate Frontend (John)", start: 20, duration: 3 },
    { name: "4.1 Testing (Mark & John)", start: 23, duration: 3 },
    { name: "4.2 Deployment (Mark & John)", start: 26, duration: 2 },
  ]

  // Chart datasets
  const data = {
    labels: tasks.map((task) => task.name), // Task names
    datasets: [
      {
        label: "Start",
        data: tasks.map((task) => task.start),
        backgroundColor: "rgba(0, 0, 0, 0)", // Invisible offset
      },
      {
        label: "Duration",
        data: tasks.map((task) => task.duration),
        backgroundColor: tasks.map((task) => {
          // Assign colors based on the person responsible
          if (task.name.includes("(Joe)")) return "rgba(75, 192, 192, 0.7)" // Joe: Green
          if (task.name.includes("(Mark)")) return "rgba(153, 102, 255, 0.7)" // Mark: Purple
          if (task.name.includes("(John)")) return "rgba(255, 159, 64, 0.7)" // John: Orange
          return "rgba(201, 203, 207, 0.7)" // Default: Grey
        }),
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hides legend for simplicity
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            const datasetLabel = tooltipItem.dataset.label
            const value = tooltipItem.raw
            return `${datasetLabel}: ${value} days`
          },
        },
      },
    },
    indexAxis: "y", // Horizontal bars
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: "Time (Days)",
        },
      },
      y: {
        stacked: true,
        title: {
          display: false,
        },
        barThickness: 3, // Set a fixed thickness for the bars
      },
    },
  }
  

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-6">Website Development Gantt Chart</h2>
      <div style={{ height: "800px" }}>
        <Bar data={data} options={options} />
      </div>
      <div className="p-2 bg-blue-500 text-black text-xl absolute h-screen left-0 top-0 flex flex-col">
        <button className="bg-white rounded mb-2 h-2">hello world</button>
        <button className="bg-white rounded p-2 flex overflow-hidden h-2">hows it going hehe hehe hehe</button>
      </div>
    </div>
  )
}
