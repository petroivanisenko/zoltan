"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { SlidersHorizontalIcon, SearchCheckIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ProductCard from "@/components/ProductCard";
import { Category, Product } from "@/generated/prisma";
import { getFilteredProducts } from "@/actions/product";
import { useDebounceValue } from "usehooks-ts";
import { Separator } from "@/components/ui/separator";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilterState } from "@/types";
import SortSelector from "@/components/SortSelector";
import LoadingIndicator from "@/components/LoadingIndicator";
import PaginationControl from "@/components/PaginationControl";
import EmptyState from "@/components/EmptyState";
import { FilterPanel } from "./filters/Filters";

interface CatalogueClientProps {
  initialProducts: Product[];
  initialTotal?: number;
  categories: Category[];
  title?: string;
  currentCategory?: number;
  minPrice: number;
  maxPrice: number;
}

const PRODUCTS_PER_PAGE = 9;

export default function CatalogueClient({
  initialProducts,
  initialTotal,
  categories,
  title = "Catalogue",
  currentCategory,
  minPrice,
  maxPrice,
}: CatalogueClientProps) {
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentSortBy = (searchParams.get("sortBy") ||
    "popular") as FilterState["sortBy"];
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [totalProducts, setTotalProducts] = useState(
    initialTotal ?? initialProducts.length,
  );
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  const [filterState, setFilterState] = useState<FilterState>({
    categoryIds: currentCategory ? [currentCategory] : [],
    occasionIds: [],
    priceRange: [minPrice, maxPrice],
    sortBy: currentSortBy,
  });

  const [debouncedPriceRange] = useDebounceValue(filterState.priceRange, 500);

  const createPageURL = useCallback(
    (pageNumber: number | string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", pageNumber.toString());
      params.set("sortBy", filterState.sortBy);
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams, filterState.sortBy],
  );

  const fetchFilteredProducts = useCallback(
    (resetPage = false) => {
      startTransition(async () => {
        const result = await getFilteredProducts({
          categoryIds: filterState.categoryIds,
          minPrice: filterState.priceRange[0],
          maxPrice: filterState.priceRange[1],
          sortBy: filterState.sortBy,
          page: resetPage ? 1 : currentPage,
          limit: PRODUCTS_PER_PAGE,
        });

        if (result && "products" in result) {
          setProducts(result.products);
          setTotalProducts(result.total);
        } else if (Array.isArray(result)) {
          setProducts(result);
          setTotalProducts(result.length);
        }

        if (resetPage) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("page", "1");
          router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
      });
    },
    [
      filterState.categoryIds,
      filterState.occasionIds,
      filterState.priceRange,
      filterState.sortBy,
      router,
      pathname,
      searchParams,
      currentPage,
    ],
  );

  const handleFilterChange = useCallback(
    (updates: Partial<FilterState>, resetPage = true) => {
      setFilterState((prev) => ({ ...prev, ...updates }));

      if (updates.sortBy) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sortBy", updates.sortBy);
        if (resetPage) params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }

      if (!updates.priceRange) {
        fetchFilteredProducts(resetPage);
      }
    },
    [fetchFilteredProducts, searchParams, pathname, router],
  );

  const resetFilters = useCallback(() => {
    setFilterState({
      categoryIds: [],
      occasionIds: [],
      priceRange: [minPrice, maxPrice],
      sortBy: "popular",
    });
    fetchFilteredProducts(true);
  }, [minPrice, maxPrice, fetchFilteredProducts]);

  useEffect(() => {
    fetchFilteredProducts(false);
  }, [debouncedPriceRange, currentPage, fetchFilteredProducts]);

  return (
    <div className="container min-h-screen mx-auto py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/catalogue">Catalogue</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold">{title}</h1>

        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Button
            variant="outline"
            className="hidden lg:flex items-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontalIcon className="h-4 w-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>

          <SortSelector
            value={filterState.sortBy}
            onChange={(sortBy) => handleFilterChange({ sortBy })}
          />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="sm:inline-flex lg:hidden">
                <SlidersHorizontalIcon className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="px-4 w-full">
              <SheetHeader>
                <SheetTitle className="flex gap-1 items-center">
                  <SearchCheckIcon /> Found: {totalProducts}{" "}
                  {totalProducts === 1 ? "product" : "products"}
                </SheetTitle>
                <SheetDescription>
                  Search by category, price range.
                </SheetDescription>
              </SheetHeader>
              <Separator />
              <ScrollArea>
                <FilterPanel
                  filterState={filterState}
                  categories={categories}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onFilterChange={handleFilterChange}
                  onReset={resetFilters}
                  isPending={isPending}
                />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
        {showFilters && (
          <div className="hidden lg:block">
            <Card>
              <CardHeader>
                <CardTitle className="flex gap-1 items-center font-raleway">
                  <SearchCheckIcon /> Found: {totalProducts}{" "}
                  {totalProducts === 1 ? "product" : "products"}
                </CardTitle>
                <CardDescription>
                  Search by category, price range.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent>
                <FilterPanel
                  filterState={filterState}
                  categories={categories}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onFilterChange={handleFilterChange}
                  onReset={resetFilters}
                  isPending={isPending}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
          {isPending ? (
            <LoadingIndicator />
          ) : products && products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <PaginationControl
                  currentPage={currentPage}
                  totalPages={totalPages}
                  createPageURL={createPageURL}
                />
              )}
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
