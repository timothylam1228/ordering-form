import React, { useState } from "react";

interface MenuItems {
  name: string;
  half: boolean;
  flavor: {
    name: string;
    price: number;
  }[];
}

interface OrderItem {
  product: string;
  flavor: string;
  isHalf: boolean;
  price: number;
}

const menuItems: MenuItems[] = [
  {
    name: "Waffle",
    half: true,
    flavor: [
      { name: "Original", price: 10 },
      { name: "Earl Grey", price: 12 },
      { name: "Chocolate", price: 12 },
      { name: "Pistacho", price: 14 },
      { name: "Ovaltine", price: 14 },
      { name: "Black sesame", price: 14 },
      { name: "Sea Salt Caramel", price: 14 },
    ],
  },
  {
    name: "Croffle",
    half: false,
    flavor: [
      { name: "Original", price: 6 },
      { name: "Chocolate", price: 8 },
      { name: "Pistacho", price: 8 },
      { name: "Ovaltine", price: 8 },
    ],
  },
];

const OrderForm = () => {
  const [orderId, setOrderId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [isHalf, setIsHalf] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followedInstagram, setFollowedInstagram] = useState(false);
  const [repostedStory, setRepostedStory] = useState(false);

  const [error, setError] = useState("");

  const selectedMenuItem = menuItems.find(
    (item) => item.name === selectedProduct
  );

  const handleAddItem = () => {
    if (!selectedProduct || !selectedFlavor) {
      setError("Please select both product and flavor");
      return;
    }

    const flavorItem = selectedMenuItem?.flavor.find(
      (f) => f.name === selectedFlavor
    );
    if (!flavorItem) return;

    const newItem: OrderItem = {
      product: selectedProduct,
      flavor: selectedFlavor,
      isHalf,
      price: calculatePrice(flavorItem.price, isHalf),
    };

    setOrderItems([...orderItems, newItem]);
    setError("");
    // Reset selections
    setSelectedFlavor("");
    setIsHalf(false);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateSocialDiscounts = () => {
    let discount = 0;
    if (followedInstagram) discount += 1;
    if (repostedStory) discount += 1;
    return discount;
  };

  // const totalPrice = orderItems.reduce((sum, item) => sum + item.price, 0);

  const subtotalPrice = orderItems.reduce((sum, item) => sum + item.price, 0);
  const socialDiscounts = calculateSocialDiscounts();
  const totalPrice = Math.max(subtotalPrice - socialDiscounts, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      setError("Please add at least one item to your order");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/bitter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          items: orderItems,
          socialDiscounts: {
            followedInstagram: followedInstagram,
            repostedStory: repostedStory,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to submit order");

      // Parse the JSON response
      const data = await response.json();

      // Reset form
      setOrderId("");
      setOrderItems([]);
      setSelectedProduct("");
      setSelectedFlavor("");
      setIsHalf(false);
      setError("");

      // Alert with waiting time
      alert(
        `Order submitted successfully!!! Your order will be ready in ${data.waitingTime}.`
      );
    } catch (err) {
      setError("Failed to submit order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePrice = (basePrice: number, isHalf: boolean) => {
    if (isHalf) {
      return basePrice / 2 + 1; // Update price calculation for half portions
    }
    return basePrice;
  };

  return (
    <div className="max-w-sm mx-auto p-4 bg-white shadow-md rounded-md">
      <div>
        <div className="text-2xl font-bold text-center">BitterSweet Christmas Order Form</div>
      </div>
      <div className="relative">
        {isLoading && (
          <div className="absolute top-0 left-0 w-full h-full bg-gray-500 bg-opacity-50 flex items-center justify-center">
            <div className="loader"></div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order ID */}
          <div>
            <label className="block text-sm font-medium mb-1">Order ID</label>
            <input
              type="number"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full p-3 border rounded-md text-base"
              min="1"
              max="48"
              required
            />
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setSelectedFlavor("");
                setIsHalf(false);
              }}
              className="w-full p-3 border rounded-md text-base"
            >
              <option value="">Select a product</option>
              {menuItems.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Flavors and Half Option */}
          {selectedProduct && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Flavor</label>
                <select
                  value={selectedFlavor}
                  onChange={(e) => setSelectedFlavor(e.target.value)}
                  className="w-full p-3 border rounded-md text-base"
                >
                  <option value="">Select a flavor</option>
                  {selectedMenuItem?.flavor.map((flavor) => (
                    <option key={flavor.name} value={flavor.name}>
                      {flavor.name} - ${flavor.price}
                      {selectedMenuItem.half &&
                        ` (Half: $${calculatePrice(flavor.price, true).toFixed(
                          2
                        )})`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMenuItem?.half && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="half"
                    checked={isHalf}
                    onChange={(e) => setIsHalf(e.target.checked)}
                    className="rounded h-5 w-5 border-gray-300"
                  />
                  <label htmlFor="half" className="text-sm font-medium">
                    Half portion (50% off)
                  </label>
                </div>
              )}
            </>
          )}

          {/* Discounts */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="follow"
              checked={followedInstagram}
              onChange={(e) => setFollowedInstagram(e.target.checked)}
              className="rounded h-5 w-5 border-gray-300"
            />
            <label htmlFor="follow" className="text-sm">
              Follow us on Instagram (-$1)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="repost"
              checked={repostedStory}
              onChange={(e) => setRepostedStory(e.target.checked)}
              className="rounded h-5 w-5 border-gray-300"
            />
            <label htmlFor="repost" className="text-sm">
              Repost our story (-$1)
            </label>
          </div>

          {/* Add to Order Button */}
          <button
            type="button"
            onClick={handleAddItem}
            className="w-full bg-green-500 text-white py-3 rounded-md hover:bg-green-600 disabled:opacity-50"
            disabled={!selectedProduct || !selectedFlavor}
          >
            Add to Order
          </button>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-lg mb-2">Order Summary</h3>
            {orderItems.length === 0 ? (
              <p className="text-gray-500">No items in order</p>
            ) : (
              <ul className="space-y-2">
                {orderItems.map((item, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>
                      {item.product} - {item.flavor}
                      {item.isHalf && " (Half)"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>${item.price.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
                <li className="flex justify-between font-medium pt-2 border-t">
                  <span>Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </li>
              </ul>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading || orderItems.length === 0}
          >
            {isLoading ? "Submitting..." : "Submit Order"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
