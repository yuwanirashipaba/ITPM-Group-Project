import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import StockService from "../../api/stockService";
import "./css/stocks.css";
import PaginationComponent from "../Common/PaginationComponent";
import ConfirmBox from "../Common/ConfirmBox";

const StockViewPage = () => {
  const [searchParams] = useSearchParams();
  const [stocks, setStocks] = useState([]);
  const [message, setMessage] = useState("");
  const [valueToSearch, setValueToSearch] = useState(
    searchParams.get("category") || ""
  );
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [generateReportOption, setGenerateReportOption] = useState("select");
  const [open, setOpen] = useState(false);
  const [deleteData, setDeleteData] = useState({});

  const navigate = useNavigate();

  //Pagination Set-Up
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    const getStocks = async () => {
      try {
        const filter = {
          substr: valueToSearch,
          availability: availabilityFilter
        }
        const stockData = await StockService.getStocksByFilter(filter);
        console.log("stockData: " + stockData);
        if (stockData.status === 200) {
          setTotalPages(Math.ceil(stockData.data.length / itemsPerPage));

          setStocks(
            stockData.data.slice(
              (currentPage - 1) * itemsPerPage,
              currentPage * itemsPerPage
            )
          );
        }
      } catch (error) {
        showMessage(
          error.response?.data?.message || "Error Getting Stocks: " + error
        );
      }
    };

    getStocks();
  }, [currentPage, valueToSearch, availabilityFilter]);

  //Delete a stock
  const handleDeleteStock = async (stockId) => {
    try {
      await StockService.deleteStockById(stockId);
      showMessage("Stock successfully deleted");
      window.location.reload(); //reload page
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Error Deleting in a Stock: " + error
      );
    }
  };

  //handle search
  const handleSearch = (searchValue) => {
    console.log("Search hit");
    console.log("filter is: " + searchValue);
    setCurrentPage(1);
    setValueToSearch(searchValue);
  };

  const handleAvailabilityChange = (value) => {
    setCurrentPage(1);
    setAvailabilityFilter(value);
  };

  const handleGenerateReport = async (value) => {
    setCurrentPage(1);
    setGenerateReportOption(value);
    if (value !== "select") {
      try {
        const response = await StockService.generateReport(value);
        
        if (response.status === 200) {
          // Create a Blob from the arraybuffer
          const blob = new Blob([response.data], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          
          // Create a download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Set the filename based on the report type
          const filename = `stock_report_${value}_${new Date().toISOString().split('T')[0]}.xlsx`;
          link.setAttribute('download', filename);
          
          // Append to body, click and remove
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the URL object
          window.URL.revokeObjectURL(url);
          
          showMessage("Report downloaded successfully");
        }
      } catch (error) {
        console.error("Error details:", error);
        showMessage(
          error.response?.data?.message || "Error generating report: " + error
        );
      }
    }
  };

  const handleEditStock = (stock) => {
    navigate(`/edit-stock/${stock.id}`);
  };

  //method to show message or errors
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  const openDelete = (data) => {
    setOpen(true);
    setDeleteData(data);
  };

  return (
    <>
      {message && <div className="message">{message}</div>}

      <div className="product-page">
        <div className="product-header">
          <h1>Stocks</h1>
            <div className="stock-search">
              <label htmlFor="search">Search:</label>
              <input
                placeholder="Search"
                value={valueToSearch}
                onChange={(e) => handleSearch(e.target.value)}
                type="text"
              />
            </div>
            <div className="availability-filter">
              <label htmlFor="availability">Availability : </label>
              <select
                id="availability"
                value={availabilityFilter}
                onChange={(e) => handleAvailabilityChange(e.target.value)}
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="outOfStock">Out of Stock</option>
              </select>
            </div>
            <div className="generate-report">
              <select
                id="availability"
                value={generateReportOption}
                onChange={(e) => handleGenerateReport(e.target.value)}
              >
                <option value="select">Generate Report</option>
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="outOfStock">Out of Stock</option>
              </select>
            </div>
          <button
            className="add-product-btn"
            onClick={() => navigate("/add-stock")}
          >
            Add Stocks
          </button>
        </div>

        {stocks && (
          <div className="product-list">
            {stocks.map((stock) => (
              <div key={stock.id} className="product-item">
                <img
                  className="product-image"
                  src={stock.filepath}
                  alt={stock.name}
                />

                <div className="product-info">
                  <h3 className="name">{stock.name}</h3>
                  <p className="sku">Category: {stock.categoryName}</p>
                  <p className="price">Price: Rs.{stock.price}</p>
                  <p className="quantity">
                    Quantity: {stock.quantity}{" "}
                    {stock.measurementUnit ? stock.measurementUnit : ""}
                  </p>
                  <p className="purchasedDate">
                    Purchased Date:{" "}
                    {stock.purchasedDate
                      ? new Date(stock.purchasedDate)
                          .toISOString()
                          .split("T")[0]
                      : ""}
                  </p>
                  <p className="expiryDate">
                    Expiry Date:{" "}
                    {stock.expiredDate
                      ? new Date(stock.expiredDate).toISOString().split("T")[0]
                      : "-"}
                  </p>
                </div>

                <div className="product-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEditStock(stock)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => openDelete(stock)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PaginationComponent
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      <ConfirmBox
        open={open}
        closeDialog={() => setOpen(false)}
        title={"Stock"}
        deleteItem={deleteData.name}
        deleteFunction={() => handleDeleteStock(deleteData.id)}
      />
    </>
  );
};
export default StockViewPage;