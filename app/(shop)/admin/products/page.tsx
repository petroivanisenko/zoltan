import { getProducts } from "@/actions/product";
import { getCategories } from "@/actions/category";
import { CategoryFilter } from "@/components/admin/CategoryFilter";
import { ProductFormModal } from "@/components/shared/ProductFormModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { resolvePublicImageUrl } from "@/lib/images";

import { DeleteProductButton } from "@/components/shared/DeleteProductButton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type SortField = "id" | "image" | "name" | "category" | "price" | "status";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sortBy?: string;
    sortOrder?: string;
    categoryId?: string;
  }>;
}) {
  const params = await searchParams;
  const limit = 10;

  const validSortFields: SortField[] = [
    "id",
    "image",
    "name",
    "category",
    "price",
    "status",
  ];
  const sortByParam = params.sortBy;
  const sortOrderParam = params.sortOrder;
  const sortBy = validSortFields.includes(sortByParam as SortField)
    ? (sortByParam as SortField)
    : "id";
  const sortOrder = sortOrderParam === "desc" ? "desc" : "asc";

  const page = parseInt(params.page || "1", 10);
  const categoryIdParam = params.categoryId;
  const categoryId =
    categoryIdParam && categoryIdParam !== "all"
      ? parseInt(categoryIdParam)
      : undefined;

  const [data, categories] = await Promise.all([
    getProducts(page, limit, categoryId),
    getCategories(),
  ]);

  const products = data && "products" in data ? data.products : [];
  const total = data && "total" in data ? data.total : 0;
  const totalPages = Math.ceil(total / limit);

  const getSortValue = (product: any, field: SortField) => {
    switch (field) {
      case "id":
        return product.id ?? 0;
      case "image":
        return product.image ?? "";
      case "name":
        return product.name ?? "";
      case "category":
        return product.category?.name ?? "";
      case "price":
        return product.price ?? 0;
      case "status":
        return product.inStock ? "In Stock" : "Out of Stock";
      default:
        return product.id ?? 0;
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    const valueA = getSortValue(a, sortBy);
    const valueB = getSortValue(b, sortBy);

    if (typeof valueA === "number" && typeof valueB === "number") {
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    }

    return sortOrder === "asc"
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA));
  });

  const createSortLink = (field: SortField) => {
    const nextOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    const search = new URLSearchParams({
      page: "1",
      sortBy: field,
      sortOrder: nextOrder,
    });
    if (categoryIdParam) search.set("categoryId", categoryIdParam);
    return `?${search.toString()}`;
  };

  const createPageLink = (targetPage: number) => {
    const search = new URLSearchParams({
      page: targetPage.toString(),
      sortBy,
      sortOrder,
    });
    if (categoryIdParam) search.set("categoryId", categoryIdParam);
    return `?${search.toString()}`;
  };

  const renderSortIndicator = (field: SortField) =>
    sortBy === field ? (sortOrder === "asc" ? "↑" : "↓") : null;

  return (
    <div className="container mx-auto py-10 px-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-accent-foreground">Products count: {total}</p>
        </div>
        <div className="flex gap-4">
          <CategoryFilter categories={categories || []} />
          <ProductFormModal />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Link
                  href={createSortLink("id")}
                  className="flex items-center gap-1"
                >
                  <span>ID</span>
                  {renderSortIndicator("id") ? (
                    <span className="text-xs">{renderSortIndicator("id")}</span>
                  ) : null}
                </Link>
              </TableHead>
              <TableHead>
                <Link
                  href={createSortLink("image")}
                  className="flex items-center gap-1"
                >
                  <span>Image</span>
                  {renderSortIndicator("image") ? (
                    <span className="text-xs">
                      {renderSortIndicator("image")}
                    </span>
                  ) : null}
                </Link>
              </TableHead>
              <TableHead>
                <Link
                  href={createSortLink("name")}
                  className="flex items-center gap-1"
                >
                  <span>Name</span>
                  {renderSortIndicator("name") ? (
                    <span className="text-xs">
                      {renderSortIndicator("name")}
                    </span>
                  ) : null}
                </Link>
              </TableHead>
              <TableHead>
                <Link
                  href={createSortLink("category")}
                  className="flex items-center gap-1"
                >
                  <span>Category</span>
                  {renderSortIndicator("category") ? (
                    <span className="text-xs">
                      {renderSortIndicator("category")}
                    </span>
                  ) : null}
                </Link>
              </TableHead>
              <TableHead>
                <Link
                  href={createSortLink("price")}
                  className="flex items-center gap-1"
                >
                  <span>Price</span>
                  {renderSortIndicator("price") ? (
                    <span className="text-xs">
                      {renderSortIndicator("price")}
                    </span>
                  ) : null}
                </Link>
              </TableHead>
              <TableHead>
                <Link
                  href={createSortLink("status")}
                  className="flex items-center gap-1"
                >
                  <span>Status</span>
                  {renderSortIndicator("status") ? (
                    <span className="text-xs">
                      {renderSortIndicator("status")}
                    </span>
                  ) : null}
                </Link>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.id}</TableCell>
                <TableCell>
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                      <img
                        src={resolvePublicImageUrl(product.image) ?? ""}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                </TableCell>
                <TableCell className="font-medium" title={product.name}>
                  {product.name.substring(0, 30)}...
                </TableCell>
                <TableCell>{product.category?.name}</TableCell>
                <TableCell>€{product.price}</TableCell>
                <TableCell>
                  <Badge variant={product.inStock ? "default" : "destructive"}>
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <ProductFormModal product={product} />
                    <DeleteProductButton productId={product.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {sortedProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No products found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={createPageLink(page > 1 ? page - 1 : 1)}
                  aria-disabled={page <= 1}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                if (
                  p === 1 ||
                  p === totalPages ||
                  (p >= page - 1 && p <= page + 1)
                ) {
                  return (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href={createPageLink(p)}
                        isActive={p === page}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                if (p === page - 2 || p === page + 2) {
                  return (
                    <PaginationItem key={p}>
                      <span className="px-4">...</span>
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  href={createPageLink(
                    page < totalPages ? page + 1 : totalPages,
                  )}
                  aria-disabled={page >= totalPages}
                  className={
                    page >= totalPages ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
