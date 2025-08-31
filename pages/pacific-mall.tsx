import React, { useState } from "react";

interface MenuItems {
  name: string;
  half: boolean;
  price?: number;
  flavor?: {
    name: string;
    price: number;
  }[];
  isQuantityBased?: boolean;
  quantities?: {
    quantity: number;
    price: number;
  }[];
}

interface FlavorCount {
  name: string;
  count: number;
}

interface OrderItem {
  product: string;
  flavor: string;
  isHalf: boolean;
  price: number;
  quantity?: number;
  selectedFlavors?: FlavorCount[];
  isPromotionalPuff?: boolean;
}

const menuItems: MenuItems[] = [
  {
    name: "Waffle",
    half: true,
    flavor: [
      { name: "Original", price: 14 },
      { name: "Nutella Crunch", price: 14 },
      { name: "Earl Grey", price: 14 },
      { name: "Matcha", price: 14 },
      { name: "Black Sesame", price: 16 },
      { name: "Pistachio", price: 16 },
      { name: "Crème Brûlée", price: 16 },
      { name: "Matcha RedBean", price: 16 }
    ],
  },
  {
    name: "Croffle",
    half: false,
    flavor: [
      { name: "Original", price: 8 },
      { name: "Chocolate", price: 8 },
      { name: "Pistachio", price: 8 },
      { name: "Crème Brûlée", price: 8 },
      { name: "Matcha", price: 8 },
      { name: "Matcha RedBean", price: 8 },
    ],
  },
  {
    name: "KeyChain",
    half: false,
    price: 8,
  },
];

const OrderForm = () => {
  const [orderId, setOrderId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [selectedFlavors, setSelectedFlavors] = useState<FlavorCount[]>([]);
  const [isHalf, setIsHalf] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [customQuantity, setCustomQuantity] = useState<number>(0);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followedInstagram, setFollowedInstagram] = useState(false);
  const [repostedStory, setRepostedStory] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    orderId: string;
    items: any[];
  } | null>(null);
  const [showPuffPromotion, setShowPuffPromotion] = useState(false);

  const [error, setError] = useState("");

  const selectedMenuItem = menuItems.find(
    (item) => item.name === selectedProduct
  );

  const handleFlavorChange = (flavorName: string, change: number) => {
    setSelectedFlavors((prev) => {
      const currentFlavor = prev.find((f) => f.name === flavorName);
      const totalCurrentCount = prev.reduce((sum, f) => sum + f.count, 0);
      const targetQuantity =
        selectedQuantity === -1 ? customQuantity : selectedQuantity;

      if (!targetQuantity || totalCurrentCount + change > targetQuantity) {
        return prev;
      }

      if (currentFlavor) {
        if (currentFlavor.count + change <= 0) {
          return prev.filter((f) => f.name !== flavorName);
        }
        return prev.map((f) =>
          f.name === flavorName ? { ...f, count: f.count + change } : f
        );
      } else if (change > 0) {
        return [...prev, { name: flavorName, count: 1 }];
      }
      return prev;
    });
  };

  const getTotalFlavorCount = () => {
    return selectedFlavors.reduce((sum, flavor) => sum + flavor.count, 0);
  };

  const hasWaffleOrCroffle = () => {
    return orderItems.some(
      (item) => item.product === "Waffle" || item.product === "Croffle"
    );
  };

  const updateKeyChainPrices = (items: OrderItem[]) => {
    const hasWaffleOrCroffleBool = items.some(
      (item) => item.product === "Waffle" || item.product === "Croffle"
    );
    
    return items.map(item => {
      if (item.product === "KeyChain") {
        return {
          ...item,
          price: hasWaffleOrCroffleBool ? 5 : 8,
          isPromotionalPuff: hasWaffleOrCroffleBool
        };
      }
      return item;
    });
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      setError("Please select a product");
      return;
    }

    const selectedMenuItem = menuItems.find(
      (item) => item.name === selectedProduct
    );
    if (!selectedMenuItem) return;

    let price = 0;
    let isPromotionalPuff = false;

    if (selectedMenuItem.name === "KeyChain" && hasWaffleOrCroffle()) {
      // 5$ key chain when there's a waffle/croffle in order
      price = 5;
      isPromotionalPuff = true;
    } else if (selectedMenuItem.flavor && selectedFlavor) {
      // For items with flavors, get price from the selected flavor
      const flavorPrice = selectedMenuItem.flavor.find(f => f.name === selectedFlavor)?.price || 0;
      price = calculatePrice(flavorPrice, isHalf);
    } else {
      // For items without flavors (like KeyChain)
      price = selectedMenuItem.price || 0;
    }

    if (selectedMenuItem.isQuantityBased) {
      if (!selectedQuantity) {
        setError("Please select quantity");
        return;
      }
      if (selectedQuantity === -1 && customQuantity <= 0) {
        setError("Please enter a valid quantity");
        return;
      }
      if (getTotalFlavorCount() === 0) {
        setError("Please select at least one flavor");
        return;
      }
      if (
        selectedQuantity !== -1 &&
        getTotalFlavorCount() !== selectedQuantity
      ) {
        setError(`Please select exactly ${selectedQuantity} pieces`);
        return;
      }
      if (selectedQuantity === -1 && getTotalFlavorCount() !== customQuantity) {
        setError(`Please select exactly ${customQuantity} pieces`);
        return;
      }
    } else if (!selectedFlavor && selectedMenuItem.flavor) {
      setError("Please select a flavor");
      return;
    }

    const newItem: OrderItem = {
      product: selectedProduct,
      flavor: selectedMenuItem.isQuantityBased ? "Mixed" : (selectedFlavor || "No Flavor"),
      isHalf,
      price,
      quantity:
        (selectedMenuItem.isQuantityBased &&
          (selectedQuantity === -1 ? customQuantity : selectedQuantity)) ||
        undefined,
      selectedFlavors: selectedMenuItem.isQuantityBased
        ? selectedFlavors
        : undefined,
      isPromotionalPuff,
    };

    const updatedItems = updateKeyChainPrices([...orderItems, newItem]);
    setOrderItems(updatedItems);
    setError("");
    // Reset selections
    setSelectedFlavor("");
    setIsHalf(false);
    setSelectedQuantity(null);
    setSelectedFlavors([]);
    setCustomQuantity(0);
  };

  const handleRemoveItem = (index: number) => {
    const filteredItems = orderItems.filter((_, i) => i !== index);
    const updatedItems = updateKeyChainPrices(filteredItems);
    setOrderItems(updatedItems);
  };

  const calculateSocialDiscounts = () => {
    let discount = 0;
    if (followedInstagram) discount += 1; // $1 discount for Instagram follow
    if (repostedStory) discount += 1; // $1 discount for story repost
    return discount;
  };

  // const totalPrice = orderItems.reduce((sum, item) => sum + item.price, 0);

  const subtotalPrice = orderItems.reduce((sum, item) => sum + item.price, 0);
  const socialDiscounts = calculateSocialDiscounts();
  const totalPrice = Math.max(subtotalPrice - socialDiscounts, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log(orderItems);
    setLastOrder(null);
    e.preventDefault();

    if (orderItems.length === 0) {
      setError("Please add at least one item to your order");
      return;
    }

    saveOrder();

    setIsLoading(true);
    try {
      console.log(orderItems);
      const response = await fetch("/api/sheet-pacific-mall", {
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
      if (basePrice === 10) return 6;
      if (basePrice === 12) return 7;
      if (basePrice === 14) return 8;
      if (basePrice === 16) return 9
      return basePrice / 2; // fallback for other cases
    }
    return basePrice;
  };

  const saveOrder = () => {
    const lastOrderState: { orderId: string; items: any[] } = {
      orderId,
      items: orderItems,
    };
    // You can add code here to save the lastOrderState, e.g., to local storage or a database
    setLastOrder(lastOrderState);
  };

  const isAddToOrderDisabled = () => {
    if (!selectedProduct) return true;

    const selectedMenuItem = menuItems.find(
      (item) => item.name === selectedProduct
    );
    if (!selectedMenuItem) return true;

    if (selectedMenuItem.isQuantityBased) {
      if (selectedQuantity === -1) {
        return customQuantity <= 0 || getTotalFlavorCount() !== customQuantity;
      }
      return !selectedQuantity || getTotalFlavorCount() !== selectedQuantity;
    }

    return !selectedFlavor && selectedMenuItem.flavor;
  };

  return (
    <div className="max-w-sm mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="mb-6">
        <div className="text-2xl font-bold text-center text-gray-800 mb-2">
          Pacific Mall
        </div>
      </div>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white font-medium">Processing...</p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order ID */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">
              Order ID
            </label>
            <input
              type="number"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-md text-base focus:ring-gray-500 focus:border-gray-500"
              min="1"
              max="100"
              required
            />
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">
              Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setSelectedFlavor("");
                setIsHalf(false);
              }}
              className="w-full p-3 border border-gray-200 rounded-md text-base focus:ring-gray-500 focus:border-gray-500"
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
              {!selectedMenuItem?.isQuantityBased ? (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-800">
                    Flavor
                  </label>
                  <select
                    value={selectedFlavor}
                    onChange={(e) => setSelectedFlavor(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-md text-base focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Select a flavor</option>
                    {selectedMenuItem?.flavor?.map((flavor) => (
                      <option key={flavor.name} value={flavor.name}>
                        {flavor.name}
                        {!selectedMenuItem.isQuantityBased &&
                          ` - $${flavor.price}`}
                        {selectedMenuItem.half &&
                          !selectedMenuItem.isQuantityBased &&
                          ` (Half: $${calculatePrice(
                            flavor.price,
                            true
                          ).toFixed(2)})`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-800">
                      Quantity
                    </label>
                    <select
                      value={selectedQuantity || ""}
                      onChange={(e) => {
                        setSelectedQuantity(Number(e.target.value));
                        setSelectedFlavors([]); // Reset flavors when quantity changes
                        setCustomQuantity(0); // Reset custom quantity when changing selection
                      }}
                      className="w-full p-3 border border-gray-200 rounded-md text-base focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="">Select quantity</option>
                      {selectedMenuItem.quantities?.map((q) => (
                        <option key={q.quantity} value={q.quantity}>
                          {q.quantity === -1
                            ? "Other (Custom Quantity - $2 each)"
                            : `${q.quantity} pieces - $${q.price}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedQuantity === -1 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-1 text-gray-800">
                        Enter Custom Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={customQuantity || ""}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setCustomQuantity(value);
                          setSelectedFlavors([]); // Reset flavors when quantity changes
                        }}
                        className="w-full p-3 border border-gray-200 rounded-md text-base focus:ring-gray-500 focus:border-gray-500"
                        placeholder="Enter quantity"
                      />
                    </div>
                  )}


                  {selectedMenuItem?.flavor && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-1 text-gray-800">
                        Select Flavors (Selected: {getTotalFlavorCount()}/
                        {selectedQuantity === -1
                          ? customQuantity
                          : selectedQuantity || "..."}
                        )
                      </label>
                      <div className="space-y-2 p-3 border border-gray-200 rounded-md">
                        {selectedMenuItem?.flavor?.map((flavor) => {
                          const flavorCount =
                            selectedFlavors.find((f) => f.name === flavor.name)
                              ?.count || 0;
                          return (
                            <div
                              key={flavor.name}
                              className="flex items-center justify-between p-2 border-b border-gray-100"
                            >
                              <span className="text-sm">{flavor.name}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleFlavorChange(flavor.name, -1)
                                  }
                                  disabled={flavorCount === 0}
                                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center disabled:opacity-50"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center">
                                  {flavorCount}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleFlavorChange(flavor.name, 1)
                                  }
                                  disabled={
                                    (!selectedQuantity &&
                                      selectedQuantity !== -1) ||
                                    getTotalFlavorCount() >=
                                      (selectedQuantity === -1
                                        ? customQuantity
                                        : selectedQuantity)
                                  }
                                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedMenuItem?.half && !selectedMenuItem.isQuantityBased && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="half"
                    checked={isHalf}
                    onChange={(e) => setIsHalf(e.target.checked)}
                    className="rounded h-5 w-5 border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  <label
                    htmlFor="half"
                    className="text-sm font-medium text-gray-800"
                  >
                    Half portion
                  </label>
                </div>
              )}
            </>
          )}

          {/* Discounts */}
          <div className="p-4 bg-gray-50 rounded-md space-y-3">
            <div className="text-sm font-medium text-gray-800 mb-2">
              Social Media Discounts
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="follow"
                checked={followedInstagram}
                onChange={(e) => setFollowedInstagram(e.target.checked)}
                className="rounded h-5 w-5 border-gray-300 text-gray-600 focus:ring-gray-500"
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
                className="rounded h-5 w-5 border-gray-300 text-gray-600 focus:ring-gray-500"
              />
              <label htmlFor="repost" className="text-sm">
                Repost our story (-$1)
              </label>
            </div>
          </div>

          {/* Puff Promotion */}
          {selectedProduct === "Cream Puff (泡芙)" && hasWaffleOrCroffle() && (
            <div className="p-4 bg-gray-50 rounded-md border-2 border-gray-800">
              <div className="text-sm font-medium text-gray-800">
                Special Promotion! 🎉
              </div>
              <div className="text-sm mt-1">
                Get Cream Puffs for only $2 each with your Waffle/Croffle order!
              </div>
            </div>
          )}

          {/* Add to Order Button */}
          <button
            type="button"
            onClick={handleAddItem}
            className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            Add to Order
          </button>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium text-lg mb-2 text-gray-800">
              Order Summary
            </h3>
            {orderItems.length === 0 ? (
              <p className="text-gray-500">No items in order</p>
            ) : (
              <ul className="space-y-2">
                {orderItems.map((item, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <div>
                      <div>
                        {item.product}{" "}
                        {item.quantity && `(${item.quantity} pcs)`}
                      </div>
                      {item.selectedFlavors ? (
                        <div className="text-sm text-gray-600">
                          Flavors:{" "}
                          {item.selectedFlavors
                            .map(
                              (f) =>
                                `${f.name}${f.count > 1 ? ` (${f.count})` : ""}`
                            )
                            .join(", ")}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          {item.flavor} {item.isHalf && "(Half)"}
                        </div>
                      )}
                    </div>
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
                <li className="flex justify-between font-medium pt-2 border-t border-gray-200">
                  <span>Subtotal:</span>
                  <span>${subtotalPrice.toFixed(2)}</span>
                </li>
                {socialDiscounts > 0 && (
                  <li className="flex justify-between text-green-600">
                    <span>Social Media Discount:</span>
                    <span>-${socialDiscounts.toFixed(2)}</span>
                  </li>
                )}
                <li className="flex justify-between font-bold text-lg text-gray-800 pt-2">
                  <span>Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </li>
              </ul>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 disabled:opacity-50"
            disabled={isLoading || orderItems.length === 0}
          >
            {isLoading ? "Submitting..." : "Submit Order"}
          </button>
        </form>
      </div>

      {/* Last Order */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="font-medium text-lg mb-2 text-gray-800">Last Order</h3>
        {lastOrder ? (
          <ul className="space-y-2">
            <li className="flex justify-between items-center">
              <span>
                Order #{lastOrder.orderId}
                {lastOrder.items.map((item, index) => (
                  <span
                    key={index}
                    className="flex flex-col text-sm text-gray-600"
                  >
                    {item.product} - {item.flavor}
                    {item.isHalf && " (Half)"}
                    {item.quantity && ` (${item.quantity} pcs)`}
                  </span>
                ))}
              </span>
            </li>
          </ul>
        ) : (
          <p className="text-gray-500">No last order</p>
        )}
      </div>
    </div>
  );
};

export default OrderForm;
