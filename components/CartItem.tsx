"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/useCartStore";
import { Trash2Icon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Product } from "@/generated/prisma";
import ProductQuantity from "./ProductQuantity";
import { resolvePublicImageUrl } from "@/lib/images";

export default function CartItem({
  productId,
  product,
  quantity,
  onCartCloseAction,
  compact = false,
}: {
  productId: number;
  product: Product;
  quantity: number;
  onCartCloseAction?: () => void;
  compact?: boolean;
}) {
  const { removeItem } = useCartStore();
  const imageSrc = resolvePublicImageUrl(product.image) ?? "";

  return (
    <div className="flex pb-4 pt-4 border-b last:border-b-0">
      <Link
        href={`/product/${productId}`}
        onClick={onCartCloseAction}
        className={`relative ${compact ? "size-28" : "size-32"} rounded-md overflow-hidden shrink-0 bg-white`}
      >
        <img
          src={imageSrc}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-contain p-2"
        />
      </Link>
      <div
        className={`${compact ? "ml-2" : "ml-4"} grow flex flex-col ${compact ? "sm:gap-1" : "gap-1"}`}
      >
        <h4 className="font-medium">{product.name}</h4>
        <div className="flex items-center">
          <Badge variant={!product.inStock ? "destructive" : "secondary"}>
            {product.inStock ? "In stock" : "Out of stock"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {product.discount && product.discount > 0 ? (
            <>
              <p className="font-medium">{product.price} €</p>
              <p className="text-muted-foreground text-sm line-through">
                {Math.round((product.price * 100) / (100 - product.discount))} €
              </p>
              <Badge variant={"default"} className="py-1 px-2 text-xs">
                -{product.discount}%
              </Badge>
            </>
          ) : (
            <p className="font-medium">{product.price} €</p>
          )}
        </div>
        <div className="flex justify-between items-center mt-1">
          <ProductQuantity
            product={product}
            quantity={quantity}
            mode="cart"
            productId={productId}
          />
          <Button
            variant="outline"
            size="icon"
            className="size-9 text-muted-foreground border-destructive"
            onClick={() => {
              toast.info(product.name, {
                description: "Product removed from cart",
              });
              removeItem(productId);
            }}
          >
            <Trash2Icon className="text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
