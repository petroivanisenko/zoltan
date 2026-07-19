"use client";

import { useEffect, useRef } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "./ui/button";
import { CartSheet } from "./CartSheet";
import { getProductsByIds } from "@/actions/product";

export default function HeaderCartButton() {
  const { cart, openCart, syncCartItems } = useCartStore();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (syncedRef.current || cart.items.length === 0) return;

    syncedRef.current = true;
    const productIds = cart.items.map((item) => item.productId);

    getProductsByIds(productIds).then((freshProducts) => {
      if (freshProducts) {
        syncCartItems(freshProducts);
      }
    });
  }, [cart.items, syncCartItems]);

  return (
    <>
      <Button
        title="Cart"
        variant="ghost"
        size="icon"
        className="relative"
        onClick={openCart}
      >
        <ShoppingCart className="text-foreground" />
        {cart.totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs size-5 rounded-full flex items-center justify-center">
            {cart.totalItems}
          </span>
        )}
      </Button>
      <CartSheet />
    </>
  );
}
