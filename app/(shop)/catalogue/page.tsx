import { getFilteredProducts, getMinMaxPrices } from "@/actions/product";
import CatalogueClient from "@/components/shop/catalogue/CatalogueClient";
import { getCategories } from "@/actions/category";
import { Metadata } from "next";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sortBy?: string;
    categoryIds?: string | string[];
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 9;
  const sortBy =
    (params.sortBy as "popular" | "price_asc" | "price_desc" | "new") ||
    "popular";

  const categoryIdsParam = params.categoryIds;
  const categoryIds = categoryIdsParam
    ? (Array.isArray(categoryIdsParam) ? categoryIdsParam : [categoryIdsParam])
        .map(Number)
        .filter(Boolean)
    : [];

  const [productsData, categories, priceRange] = await Promise.all([
    getFilteredProducts({
      page,
      limit,
      sortBy,
      categoryIds,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    }),
    getCategories(),
    getMinMaxPrices(),
  ]);

  const products =
    productsData && "products" in productsData
      ? productsData.products
      : Array.isArray(productsData)
        ? productsData
        : [];

  const total =
    productsData && "total" in productsData
      ? productsData.total
      : products.length;

  return (
    <CatalogueClient
      initialProducts={products}
      initialTotal={total}
      categories={categories || []}
      minPrice={priceRange.min}
      maxPrice={priceRange.max}
    />
  );
}

export const metadata: Metadata = {
  title: "Electronics Catalogue - ZoltanTech LTD",
  description:
    "Browse premium electronics for home and office. Computers, laptops, gaming equipment, TVs, appliances, and more from €1,000 to €7,000.",
};
