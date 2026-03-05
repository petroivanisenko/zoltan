"use server";

import { Category, Prisma, Product } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import { revalidatePath } from "next/cache";

export type ProductWithCategory = Product & {
  category: Category | null;
};

export type ProductFilterParams = {
  categoryIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "popular" | "price_asc" | "price_desc" | "new";
  searchQuery?: string;
  page?: number;
  limit?: number;
  ratingGte?: number;
};

export type PaginatedProducts = {
  products: ProductWithCategory[];
  total: number;
};

export async function getFilteredProducts(
  filters: ProductFilterParams = {},
): Promise<ProductWithCategory[] | PaginatedProducts | null> {
  const {
    categoryIds = [],
    minPrice,
    maxPrice,
    sortBy = "popular",
    searchQuery,
    page,
    limit,
    ratingGte,
  } = filters;

  const where: Prisma.ProductWhereInput = {};

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  if (categoryIds.length > 0) where.categoryId = { in: categoryIds };
  if (searchQuery) where.name = { contains: searchQuery, mode: "insensitive" };
  if (ratingGte !== undefined) where.rating = { gte: ratingGte };

  let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
  switch (sortBy) {
    case "price_asc":
      orderBy = [{ price: "asc" }, { id: "asc" }];
      break;
    case "price_desc":
      orderBy = [{ price: "desc" }, { id: "asc" }];
      break;
    case "new":
      orderBy = [{ createdAt: "desc" }, { id: "asc" }];
      break;
    case "popular":
    default:
      orderBy = [{ rating: "desc" }, { id: "asc" }];
      break;
  }

  if (page && limit) {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);
    return { products, total };
  }

  return prisma.product.findMany({
    where,
    orderBy,
    include: { category: true },
    ...(limit ? { take: limit } : {}),
  });
}

export async function getProducts(
  page?: number,
  limit?: number,
  categoryId?: number,
): Promise<ProductWithCategory[] | PaginatedProducts | null> {
  return getFilteredProducts({
    page,
    limit,
    categoryIds: categoryId ? [categoryId] : undefined,
    sortBy: "new",
  });
}

export async function getPopularProducts() {
  const result = await getFilteredProducts({
    ratingGte: 4,
    limit: 10,
    sortBy: "popular",
  });
  return result as ProductWithCategory[];
}

export async function getProduct(
  id: number,
): Promise<ProductWithCategory | null> {
  try {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
  } catch (error) {
    console.error(`Failed to get product ${id}:`, error);
    return null;
  }
}

export async function getSimilarProducts(
  categoryId: number,
): Promise<ProductWithCategory[]> {
  const result = await getFilteredProducts({
    categoryIds: [categoryId],
    limit: 4,
  });
  return result as ProductWithCategory[];
}

export async function searchProducts(
  query: string,
): Promise<ProductWithCategory[]> {
  const result = await getFilteredProducts({
    searchQuery: query,
  });
  return result as ProductWithCategory[];
}

export async function getMinMaxPrices(): Promise<{ min: number; max: number }> {
  const aggregate = await prisma.product.aggregate({
    _min: {
      price: true,
    },
    _max: {
      price: true,
    },
  });

  return {
    min: aggregate._min.price ?? 0,
    max: aggregate._max.price ?? 0,
  };
}

export async function getProductDetails(id: number) {
  return getProduct(id);
}

function parseProductFormData(formData: FormData) {
  return {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    price: parseInt(formData.get("price") as string),
    categoryId: parseInt(formData.get("categoryId") as string),
    discount: parseInt(formData.get("discount") as string) || 0,
    rating: parseFloat(formData.get("rating") as string) || 0,
    inStock:
      formData.get("inStock") === "on" || formData.get("inStock") === "true",
  };
}

async function processProductImage(
  imageFile: File | string | null,
  existingImageUrl?: string,
): Promise<string | undefined> {
  if (!imageFile) return undefined;

  if (imageFile instanceof File) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const fileName = `${Date.now()}-${imageFile.name}`;
    return await uploadToS3(buffer, fileName, imageFile.type);
  }

  if (typeof imageFile === "string") {
    if (imageFile.startsWith("data:")) {
      const matches = imageFile.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        const fileName = `${Date.now()}-pasted.${contentType.split("/")[1]}`;
        return await uploadToS3(buffer, fileName, contentType);
      }
    } else if (imageFile.startsWith("http")) {
      if (existingImageUrl && existingImageUrl === imageFile) {
        return imageFile;
      }

      const response = await fetch(imageFile);
      if (!response.ok) throw new Error("Failed to fetch image from URL");

      const contentType = response.headers.get("content-type") || "image/jpeg";
      if (!contentType.startsWith("image/"))
        throw new Error("URL provided is not an image");

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extension = contentType.split("/")[1].split(";")[0];
      const fileName = `${Date.now()}-imported.${extension}`;
      return await uploadToS3(buffer, fileName, contentType);
    }
  }

  return undefined;
}

export async function createProduct(formData: FormData) {
  const data = parseProductFormData(formData);
  const imageFile = formData.get("image") as File | string;
  const imageUrl = await processProductImage(imageFile);

  if (!imageUrl) {
    throw new Error("Image is required");
  }

  await prisma.product.create({
    data: {
      ...data,
      image: imageUrl,
    },
  });

  revalidatePath("/");
  revalidatePath("/catalogue");
  revalidatePath("/admin/products");
}

export async function updateProduct(id: number, formData: FormData) {
  const data = parseProductFormData(formData);
  const imageFile = formData.get("image") as File | string | null;

  const existingProduct = await prisma.product.findUnique({
    where: { id },
    select: { image: true },
  });

  const imageUrl = await processProductImage(
    imageFile,
    existingProduct?.image || undefined,
  );

  await prisma.product.update({
    where: { id },
    data: {
      ...data,
      ...(imageUrl ? { image: imageUrl } : {}),
    },
  });

  revalidatePath("/");
  revalidatePath("/catalogue");
  revalidatePath("/admin/products");
}

export async function deleteProduct(id: number) {
  try {
    await prisma.product.delete({
      where: { id },
    });
    revalidatePath("/");
    revalidatePath("/catalogue");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}
