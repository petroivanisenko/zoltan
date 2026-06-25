import CatalogueClient from "@/components/shop/catalogue/CatalogueClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getCategories } from "@/actions/category";
import { getFilteredProducts, getMinMaxPrices } from "@/actions/product";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    sortBy?: string;
    categoryIds?: string | string[];
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const { slug } = await params;
  const searchParamsResolved = await searchParams;
  const page = parseInt(searchParamsResolved.page || "1", 10);
  const limit = 9;
  const sortBy =
    (searchParamsResolved.sortBy as "popular" | "price_asc" | "price_desc" | "new") ||
    "popular";

  const category = await prisma.category.findFirst({
    where: { slug },
  });

  if (!category) notFound();

  const categoryIdsParam = searchParamsResolved.categoryIds;
  const categoryIds = categoryIdsParam
    ? (Array.isArray(categoryIdsParam) ? categoryIdsParam : [categoryIdsParam])
        .map(Number)
        .filter(Boolean)
    : [category.id];

  const [productsData, categories, priceRange] = await Promise.all([
    getFilteredProducts({
      page,
      limit,
      sortBy,
      categoryIds,
      minPrice: searchParamsResolved.minPrice ? Number(searchParamsResolved.minPrice) : undefined,
      maxPrice: searchParamsResolved.maxPrice ? Number(searchParamsResolved.maxPrice) : undefined,
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
      title={`${category.name} - ZoltanTech LTD`}
      currentCategory={category.id}
      minPrice={priceRange.min}
      maxPrice={priceRange.max}
    />
  );
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return (categories || []).map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = (await params).slug;
  const category = await prisma.category.findFirst({
    where: { slug },
  });

  if (!category)
    return {
      title: "Category Not Found",
      description: "The requested category was not found.",
    };

  return {
    title: `${category.name} - ZoltanTech LTD`,
    description: `Browse our premium ${category.name} collection. High-end electronics for home and office from ZoltanTech LTD.`,
  };
}
