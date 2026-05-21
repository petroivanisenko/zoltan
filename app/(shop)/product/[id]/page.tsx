import Rating from "@/components/shared/Rating";
import { notFound } from "next/navigation";
import { getProduct, getProducts, getSimilarProducts } from "@/actions/product";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/ProductCard";
import CopyLinkButton from "@/components/CopyLinkButton";
import AddProduct from "@/components/shop/product/AddProduct";

import { SetBreadcrumbs } from "@/components/SetBreadcrumbs";
import { getComments } from "@/actions/comments";
import CommentCard from "@/components/shop/product/CommentCard";
import NewComment from "@/components/shop/product/NewComment";
import ReadMore from "@/components/ReadMore";
import { Metadata } from "next";
import { Product } from "@/generated/prisma";
import { resolvePublicImageUrl } from "@/lib/images";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = parseInt((await params).id);
  if (isNaN(id)) notFound();

  const product = await getProduct(id);
  if (!product) notFound();
  const similarProducts = await getSimilarProducts(product.categoryId);
  const comments = await getComments(id);
  const filteredSimilarProducts = similarProducts
    ?.filter((p) => p.id !== product.id)
    .slice(0, 4);

  const originalPrice = Math.round(
    product.price * (1 + product.discount / 100),
  );
  const hasDiscount = product.discount > 0;

  const imageSrc = resolvePublicImageUrl(product.image) ?? "";

  return (
    <main className="container min-h-[calc(100vh-68px)] mx-auto py-6 md:py-10 px-4 md:px-8">
      <SetBreadcrumbs
        items={[
          {
            label:
              product.name.length > 40
                ? product.name.slice(0, 40) + "..."
                : product.name,
            href: `/product/${product.id}`,
            title: product.name,
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-white border">
          <img
            src={imageSrc}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-contain p-6 hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col h-full">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            {product.name}
          </h1>

          <div className="flex gap-2 items-center mb-5">
            <div className="flex text-yellow-500">
              <Rating rating={product.rating || 0} size={16} />
            </div>
            {product.rating && (
              <span className="text-sm font-medium text-muted-foreground">
                {product.rating.toFixed(1)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-5">
            <Badge variant={!product.inStock ? "destructive" : "secondary"}>
              {!product.inStock ? "Out of stock" : "In stock"}
            </Badge>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl font-bold text-primary">
              {product.price} €
            </span>
            {hasDiscount && (
              <span className="text-muted-foreground line-through text-lg">
                {originalPrice} €
              </span>
            )}
            {hasDiscount && (
              <Badge variant={"default"} className="py-1 px-2 text-base">
                -{product.discount}%
              </Badge>
            )}
          </div>

          <div className="prose prose-sm max-w-none mb-8 text-muted-foreground">
            <ReadMore text={product.description} />
          </div>

          {product.inStock && <AddProduct product={product} />}
          <div className="mt-4">
            <h1 className="text-xl md:text-2xl font-bold mb-4">Share</h1>
            <CopyLinkButton text="Link to product" />
          </div>
        </div>
      </div>

      {filteredSimilarProducts && filteredSimilarProducts.length > 0 && (
        <section className="mt-16 md:mt-24">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Similar Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSimilarProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
      <div className="mt-16 md:mt-24">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">Comments</h2>
        <NewComment productId={product.id} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {comments?.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = parseInt((await params).id);
  if (isNaN(id)) return { title: "Product Not Found" };

  const product = await getProduct(id);

  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} | ZoltanTech LTD`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: resolvePublicImageUrl(product.image) ?? "" }],
    },
  };
}

export async function generateStaticParams() {
  const result = await getProducts();

  const products = Array.isArray(result)
    ? result
    : result && "products" in result
      ? result.products
      : [];

  return products.map((product: Product) => ({
    id: String(product.id),
  }));
}
