import React, { useEffect, useState } from "react";

interface OrderItem {
  item: MenuItem;
}

interface FormData {
  orderId: string;
  items: OrderItem[];
}

interface MenuItem {
  name: string;
  price: number;
  withDrink?: boolean;
}

interface Category {
  items?: MenuItem[];
}

const menuItems: Category = {
  items: [
    { name: "Original Waffle", price: 8, withDrink: false },
    { name: "Nutella Crunch", price: 10, withDrink: false },
    { name: "Original Chocolate", price: 10, withDrink: false },
    { name: "Matcha Waffle", price: 8, withDrink: false },
    { name: "Pistachio Waffle", price: 12, withDrink: false },
    { name: "Hot Milk Tea", price: 4 },
  ],
};

function App() {
  const [formData, setFormData] = useState<FormData>({
    orderId: "",
    items: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const totalPrice = formData.items.reduce((sum) => sum, 0);

  const handleOrderIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prevState) => ({
      ...prevState,
      orderId: e.target.value,
    }));
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("change product");
    if (e.target.value) {
      const foundItem = menuItems.items?.find(
        (item) => item.name === e.target.value
      );
      if (foundItem) {
        setSelectedItem(foundItem);
      } else {
        console.log("");
        setSelectedItem(null);
      }
    }
  };

  const handleAddItem = () => {
    console.log("formData.items", formData.items);

    if (selectedItem) {
      // Check if "Hot Milk Tea" is included with a waffle
      if (selectedItem.withDrink) {
        selectedItem.price = selectedItem.price + 2;
      }
      setFormData((prevState) => ({
        ...prevState,
        items: [
          ...prevState.items,
          {
            item: {
              name: selectedItem.name,
              price: selectedItem.price,
              withDrink: selectedItem.withDrink,
            },
          },
        ],
      }));
      setSelectedItem(null);
    } else {
      setSelectedItem(null);
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prevState) => ({
      ...prevState,
      items: prevState.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted:", formData);
    if (isLoading) return; // Prevent multiple submits

    setIsLoading(true); // Set loading status to true

    const submissionData = {
      orderId: formData.orderId,
      items: formData.items,
    };

    try {
      if (formData.items.length === 0) {
        throw new Error("No items");
      }
      const response = await fetch("/api/sheetv2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      alert("Form submitted successfully!");
      // Reset form

      setSelectedItem(null);
      setFormData({
        orderId: "",
        items: [],
      });
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while submitting the form.");
    } finally {
      setIsLoading(false); // Reset loading status
    }
  };

  return (
    <div
      className={`max-w-md mx-auto p-8 bg-white shadow-lg rounded-lg ${
        isLoading ? "relative" : ""
      }`}
    >
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-full bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="loader"></div>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4 text-center">
        Bitter Sweet Order Form
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="orderId"
            className="block text-sm font-medium text-gray-700"
          >
            Order ID:
          </label>
          <input
            type="number"
            id="orderId"
            name="orderId"
            inputMode="numeric"
            pattern="[0-9]*"
            max={48}
            min={1}
            value={formData.orderId}
            onChange={handleOrderIdChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Select Product:
          </label>
          <select
            id="product"
            name="product"
            value={selectedItem?.name || ""}
            onChange={handleProductChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a category</option>
            {menuItems.items!.map((item, index) => (
              <option key={index} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          {selectedItem && selectedItem?.name !== "Hot Milk Tea" && (
            <div className="flex flex-row items-center mb-4">
              <label className="flex pr-4">With Drink?</label>
              <input
                type="checkbox"
                id="withdrink"
                name="withdrink"
                checked={selectedItem?.withDrink}
                onChange={(e) => {
                  setSelectedItem((pre) => {
                    if (pre && pre.name !== "Hot Milk Tea") {
                      return {
                        ...pre,
                        withDrink: e.target.checked,
                      };
                    }
                    return pre;
                  });
                }}
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleAddItem}
            className="mt-2 w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
          >
            Add
          </button>
        </div>
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2">Order Summary</h2>
          {formData.items.length > 0 ? (
            <ul className="list-disc list-inside">
              {formData.items.map((orderItem, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center flex-row"
                >
                  <label className="flex flex-wrap w-4/5">
                    {orderItem.item.name}
                    {orderItem.item.withDrink ? " - With Drink" : ""}
                  </label>
                  <div className="flex">
                    <label>({orderItem.item.price})</label>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No items in order.</p>
          )}
        </div>
        <div className="mb-4">
          <h2 className="text-lg font-bold">
            Total Price: ${totalPrice.toFixed(2)}
          </h2>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        >
          Submit Order
        </button>
      </form>
    </div>
  );
}

export default App;
