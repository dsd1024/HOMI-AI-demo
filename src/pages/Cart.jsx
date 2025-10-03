import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Cart as CartEntity } from "@/api/entities";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const items = await CartEntity.list("-created_date");
      setCartItems(items);
    } catch (err) {
      console.error("Cart loading error:", err);
    }
    setLoading(false);
  };

  const updateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(true);
    try {
      await CartEntity.update(item.id, {
        ...item,
        quantity: newQuantity
      });
      await loadCart();
    } catch (err) {
      console.error("Update error:", err);
    }
    setUpdating(false);
  };

  const removeItem = async (itemId) => {
    setUpdating(true);
    try {
      await CartEntity.delete(itemId);
      await loadCart();
    } catch (err) {
      console.error("Delete error:", err);
    }
    setUpdating(false);
  };

  const totalPrice = cartItems.reduce((sum, item) => 
    sum + (item.price * (item.quantity || 1)), 0
  );

  const totalItems = cartItems.reduce((sum, item) => 
    sum + (item.quantity || 1), 0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F4]">
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="px-4 pt-6 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#2C2C2C]">Shopping Cart</h1>
            <p className="text-xs text-gray-500">{totalItems} items</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some products to get started</p>
            <Link to={createPageUrl("Marketplace")}>
              <Button className="bg-[#0A4D4E] hover:bg-[#0A4D4E]/90">
                <Package className="w-4 h-4 mr-2" />
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3">
              {cartItems.map(item => (
                <Card key={item.id} className="border-none shadow-md overflow-hidden">
                  <div className="p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      {item.product_image && (
                        <Link 
                          to={createPageUrl(`ProductDetail?id=${item.product_id}`)}
                          className="flex-shrink-0"
                        >
                          <img 
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-20 h-20 object-cover rounded-xl"
                          />
                        </Link>
                      )}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link to={createPageUrl(`ProductDetail?id=${item.product_id}`)}>
                          <h3 className="font-semibold text-[#2C2C2C] line-clamp-2 hover:text-[#0A4D4E] transition-colors">
                            {item.product_name}
                          </h3>
                        </Link>
                        <p className="text-lg font-bold text-[#0A4D4E] mt-1">
                          ${item.price}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
                            <button
                              onClick={() => updateQuantity(item, item.quantity - 1)}
                              disabled={updating || item.quantity <= 1}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() => updateQuantity(item, item.quantity + 1)}
                              disabled={updating}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={updating}
                            className="ml-auto text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Item Subtotal */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="font-bold text-[#0A4D4E]">
                        ${(item.price * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary Card */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-[#0A4D4E] to-[#0A4D4E]/80 text-white sticky bottom-20">
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/80">Subtotal</span>
                  <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/80">Shipping</span>
                  <span className="font-semibold">Calculated at checkout</span>
                </div>
                <div className="pt-3 border-t border-white/20 flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Fixed Checkout Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
          <Button 
            className="w-full bg-[#D4745F] hover:bg-[#D4745F]/90 h-14 text-lg font-semibold"
            onClick={() => alert("Checkout functionality coming soon!")}
          >
            Proceed to Checkout · ${totalPrice.toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  );
}