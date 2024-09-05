import React, { useState } from "react";

interface OrderItem {
  item: MenuItem;
  quantity: number;
  category: string;
}

interface FormData {
  orderId: string;
  items: OrderItem[];
}

interface MenuItem {
  name: string;
  price: number;
}

interface Subcategory {
  name: string;
  items: MenuItem[];
}

interface Category {
  name: string;
  subcategories?: Subcategory[];
  items?: MenuItem[];
  isCombo: boolean;
}

const menuItems: Category[] = [
  {
    name: "Classic Combo - 1 Waffle + 1 Drink",
    isCombo: true,
    subcategories: [
      {
        name: "Waffle Flavors",
        items: [
          { name: "Classic Waffle (Chocolate)", price: 10 },
          { name: "Classic Waffle (Matcha)", price: 10 },
          { name: "Classic Waffle (Original)", price: 10 },
          { name: "Classic Waffle (Sesame)", price: 10 },
        ],
      },
      {
        name: "Drink Options",
        items: [
          { name: "Hot Milk tea", price: 0 },
          { name: "Iced Milk Tea", price: 0 },
          { name: "Lemonade", price: 0 },
          { name: "No Drink", price: 0 },
        ],
      },
    ],
  },
  {
    name: "Savoury Combo",
    isCombo: false,
    items: [
      { name: "Crispy Ebi", price: 10 },
      { name: "Seaweed Pork Floss", price: 10 },
      { name: "Pulled Pork", price: 10 },
    ],
  },
  {
    name: "Sweet Combo - 1 Waffle + Ice Cream",
    isCombo: false,
    items: [
      { name: "Creme Burlee", price: 10 },
      { name: "Matcha Red Bean", price: 10 },
      { name: "Chocolate Nutella Crunch", price: 10 },
    ],
  },
  {
    name: "Milkshakes",
    isCombo: false,
    items: [{ name: "Oreo Milkshake", price: 10 }],
  },
  {
    name: "Drink Combo",
    isCombo: true,
    subcategories: [
      {
        name: "First Drink",
        items: [
          { name: "Lemonade", price: 10 },
          { name: "Hot Milk tea", price: 10 },
          { name: "Iced Milktea", price: 10 },
        ],
      },
      {
        name: "Second Drink",
        items: [
          { name: "Lemonade", price: 0 },
          { name: "Hot Milk tea", price: 0 },
          { name: "cold Milk tea", price: 0 },
        ],
      },
    ],
  },
];

function App() {
  const [formData, setFormData] = useState<FormData>({
    orderId: "",
    items: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [currentSubcategories, setCurrentSubcategories] = useState<
    Record<string, MenuItem | null>
  >({});
  const [currentQuantity, setCurrentQuantity] = useState(1);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category =
      menuItems.find((cat) => cat.name === e.target.value) || null;
    setCurrentCategory(category);
    setCurrentSubcategories({});
  };

  const handleSubcategoryChange = (
    subcategoryName: string,
    item: MenuItem | null
  ) => {
    setCurrentSubcategories((prev) => ({
      ...prev,
      [subcategoryName]: item,
    }));
  };

  const handleItemChange = (categoryName: string, item: MenuItem) => {
    setCurrentSubcategories((prev) => ({
      ...prev,
      [categoryName]: item,
    }));
    return;
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentQuantity(Number(e.target.value));
  };

  const handleAddItem = () => {
    if (currentCategory) {
      if (currentCategory.isCombo) {
        // Handle Combo categories with subcategories
        const selectedItems = Object.values(currentSubcategories).filter(
          Boolean
        ) as MenuItem[];

        if (selectedItems.length === Object.keys(currentSubcategories).length) {
          const comboItem: MenuItem = {
            name: selectedItems.map((item) => item.name).join(" + "),
            price: selectedItems.reduce((sum, item) => sum + item.price, 0),
          };

          setFormData((prevState) => ({
            ...prevState,
            items: [
              ...prevState.items,
              {
                item: comboItem,
                quantity: currentQuantity,
                category: currentCategory.name,
              },
            ],
          }));
        } else {
          alert("Please select an item from each subcategory.");
        }
      } else if (currentCategory.items && currentQuantity > 0) {
        // Handle regular categories without subcategories
        const currentItem = currentCategory.items[0];
        const selectedItems = Object.values(currentSubcategories).filter(
          Boolean
        ) as MenuItem[];

        setFormData((prevState) => ({
          ...prevState,
          items: [
            ...prevState.items,
            {
              item: selectedItems[0],
              quantity: currentQuantity,
              category: currentCategory.name,
            },
          ],
        }));
      }

      // Reset selections
      setCurrentCategory(null);
      setCurrentSubcategories({});
      setCurrentQuantity(1);
    } else {
      alert("Please select a category.");
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prevState) => ({
      ...prevState,
      items: prevState.items.filter((_, i) => i !== index),
    }));
  };

  const handleOrderIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prevState) => ({
      ...prevState,
      orderId: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      const response = await fetch("/api/sheet", {
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

      setCurrentCategory(null);
      setCurrentSubcategories({});
      setCurrentQuantity(1);
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

  const availableSubcategories = currentCategory?.subcategories || [];

  const totalPrice = formData.items.reduce(
    (sum, orderItem) => sum + orderItem.item.price * orderItem.quantity,
    0
  );

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
        Waffle Shop Order Form
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
            Select Category:
          </label>
          <select
            id="category"
            name="category"
            value={currentCategory?.name || ""}
            onChange={handleCategoryChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a category</option>
            {menuItems.map((category, index) => (
              <option key={index} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {currentCategory &&
          currentCategory.isCombo &&
          availableSubcategories.length > 0 && (
            <>
              {availableSubcategories.map((subcategory, subIndex) => (
                <div className="mb-4" key={subIndex}>
                  <label
                    htmlFor={`subcategory-${subIndex}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Select {subcategory.name}:
                  </label>
                  <select
                    id={`subcategory-${subIndex}`}
                    name={`subcategory-${subIndex}`}
                    value={currentSubcategories[subcategory.name]?.name || ""}
                    onChange={(e) =>
                      handleSubcategoryChange(
                        subcategory.name,
                        subcategory.items.find(
                          (item) => item.name === e.target.value
                        ) || null
                      )
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select an item</option>
                    {subcategory.items.map((item, itemIndex) => (
                      <option key={itemIndex} value={item.name}>
                        {item.name} (Price: ${item.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </>
          )}

        {currentCategory && !currentCategory.isCombo && (
          <>
            <option value="">Select {currentCategory.name}</option>
            <select
              id="category"
              name="category"
              // value={currentCategory.items[] || ""}
              onChange={(e) => {
                const selectedItem = currentCategory?.items?.find(
                  (item) => item.name === e.target.value
                );

                if (selectedItem) {
                  handleItemChange(currentCategory!.name, selectedItem);
                }
              }}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an item</option>

              {currentCategory.items?.map((item, index) => (
                <option key={index} value={item.name}>
                  {item.name} (Price: ${item.price.toFixed(2)})
                </option>
              ))}
            </select>
          </>
        )}

        <div className="mb-4">
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700"
          >
            Quantity:
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={currentQuantity}
            onChange={handleQuantityChange}
            min="1"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="mt-2 w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
          >
            Add {currentCategory?.name === "Combo A" ? "Combo" : "Item"}
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
                    {orderItem.category} - {orderItem.item.name} x{" "}
                    {orderItem.quantity}
                  </label>
                  <div className="flex">
                    <label>({orderItem.item.price * orderItem.quantity})</label>
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
