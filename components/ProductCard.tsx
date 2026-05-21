import Rating from "@/components/shared/Rating";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Product } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AddToCartButton from "./AddToCartButton";
import { resolvePublicImageUrl } from "@/lib/images";

export default function ProductCard({ product }: { product: Product }) {
  const imageSrc = resolvePublicImageUrl(product.image) ?? "";

  return (
    <Card key={product.id} className="relative flex flex-col h-full pt-0">
      <Link
        href={`/product/${product.id}`}
        className="hover:text-primary flex flex-col grow"
      >
        <div className="relative w-full aspect-square mb-4 bg-white rounded-t-lg overflow-hidden">
          <img
            src={imageSrc}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-contain p-4"
          />
        </div>

        <CardHeader className="px-4 grow">
          {/* Rating display */}
          <div className="flex items-center mb-2">
            <Rating rating={product.rating || 0} size={16} />
            <span className="text-xs ml-2 text-muted-foreground">
              {product.rating ? `${product.rating.toFixed(1)}` : "No rating"}
            </span>
          </div>

          <CardTitle className="text-base line-clamp-2" title={product.name}>
            {product.name}
          </CardTitle>

          <CardDescription className="text-sm text-muted-foreground line-clamp-3 mt-1">
            {product.description}
          </CardDescription>
        </CardHeader>
      </Link>

      <CardFooter className="px-4 py-3 mt-auto">
        <div className="w-full flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex flex-col">
                {product.discount > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground line-through">
                      {Math.round(
                        product.price +
                        (product.discount * product.price) / 100,
                      )}{" "}
                      €
                    </span>
                    <Badge
                      variant={"default"}
                      className="ml-2 py-1 px-2 text-xs"
                    >
                      -{product.discount}%
                    </Badge>
                  </div>
                )}
                <span className="text-lg font-bold">{product.price} €</span>
              </div>
              {/* Stock information */}
              <Badge variant={!product.inStock ? "destructive" : "secondary"}>
                {!product.inStock ? "Out of stock" : "In stock"}
              </Badge>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <AddToCartButton product={product} quantity={1} />
                </div>
              </TooltipTrigger>
              {!product.inStock && (
                <TooltipContent>
                  <p>Product out of stock</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
}
