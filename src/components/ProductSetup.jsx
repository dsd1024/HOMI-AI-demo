import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { Store } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Package } from "lucide-react";

export default function ProductSetup() {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedStores, setSelectedStores] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [productsData, storesData] = await Promise.all([
      Product.list(),
      Store.list()
    ]);
    setProducts(productsData);
    setStores(storesData);
    setLoading(false);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    // Find stores that have this product
    const storesWithProduct = stores
      .filter(store => store.product_ids?.includes(product.id))
      .map(store => store.id);
    setSelectedStores(storesWithProduct);
  };

  const toggleStore = (storeId) => {
    setSelectedStores(prev => 
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const saveStoreAssociations = async () => {
    if (!selectedProduct) return;

    setUpdating(true);

    try {
      // Update each store's product_ids
      for (const store of stores) {
        const shouldHaveProduct = selectedStores.includes(store.id);
        const currentlyHasProduct = store.product_ids?.includes(selectedProduct.id);

        if (shouldHaveProduct && !currentlyHasProduct) {
          // Add product to store
          await Store.update(store.id, {
            ...store,
            product_ids: [...(store.product_ids || []), selectedProduct.id]
          });
        } else if (!shouldHaveProduct && currentlyHasProduct) {
          // Remove product from store
          await Store.update(store.id, {
            ...store,
            product_ids: store.product_ids.filter(id => id !== selectedProduct.id)
          });
        }
      }

      alert("Store associations updated successfully!");
      await loadData();
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update store associations");
    }

    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A4D4E]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#2C2C2C] mb-2">Product-Store Setup</h1>
          <p className="text-gray-600">Assign products to stores for pickup availability</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products List */}
          <Card className="border-none shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Products ({products.length})
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedProduct?.id === product.id
                      ? 'border-[#0A4D4E] bg-[#0A4D4E]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {product.image_url && (
                      <img 
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500">${product.price}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Stores List */}
          <Card className="border-none shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              Available Stores ({stores.length})
            </h2>
            
            {!selectedProduct ? (
              <div className="text-center py-12 text-gray-500">
                Select a product to assign stores
              </div>
            ) : (
              <>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Selected: {selectedProduct.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose stores where this product is available for pickup
                  </p>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
                  {stores.map(store => (
                    <label
                      key={store.id}
                      className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedStores.includes(store.id)}
                        onCheckedChange={() => toggleStore(store.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{store.store_name}</h4>
                        <p className="text-sm text-gray-600">{store.city}, {store.state}</p>
                        <p className="text-xs text-gray-500 mt-1">{store.address}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <Button
                  onClick={saveStoreAssociations}
                  disabled={updating}
                  className="w-full bg-[#0A4D4E] hover:bg-[#0A4D4E]/90"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    `Save Store Associations (${selectedStores.length} selected)`
                  )}
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}