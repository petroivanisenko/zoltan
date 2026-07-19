"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  MapPin,
  ShoppingCart,
  User,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { resolvePublicImageUrl } from "@/lib/images";
import { useRouter } from "next/navigation";
import { SetBreadcrumbs } from "@/components/SetBreadcrumbs";
import { useCartStore } from "@/store/useCartStore";
import { placeOrder } from "@/actions/place-order";

export default function CheckoutPage() {
  const { cart, clearItems } = useCartStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    address: "",
    postalCode: "",
    additionalInfo: "",
  });

  const totalAmount = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const hasOutOfStockItems = cart.items.some((item) => !item.product.inStock);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasOutOfStockItems) {
      toast.error("Checkout Disabled", {
        description: "Please remove out of stock items from your cart before proceeding.",
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const result = await placeOrder({
        ...formData,
        items: cart.items,
        totalAmount,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to place order");
      }

      // Show success message
      toast.success("Order Placed Successfully!", {
        description: "Check your email for the invoice and payment details.",
      });

      // Clear cart and redirect
      clearItems();
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong", {
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto text-center py-12">
          <CardHeader>
            <CardTitle className="text-2xl">Your Cart is Empty</CardTitle>
            <CardDescription>
              Add some products to your cart before checkout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/catalogue">
              <Button size="lg">Browse Catalogue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto pb-4 sm:pb-6 md:pb-8 px-4 sm:px-6 md:px-8">
      <SetBreadcrumbs items={[{ label: "Checkout", href: "/checkout" }]} />

      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <Alert className="mb-6 border-primary">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Payment Information</AlertTitle>
        <AlertDescription>
          After submitting your order, you will receive an invoice via email
          with our SEPA bank transfer details. Full prepayment is required
          before order processing.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
              <CardDescription>
                Please provide accurate delivery information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="+44 1234567890"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="john.doe@example.com"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Invoice and payment details will be sent to this email
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Delivery Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Delivery Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                        placeholder="United Kingdom"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        placeholder="London"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      placeholder="123 Main Street, Apartment 4B"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                      placeholder="SW1A 1AA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additionalInfo">
                      Additional Information (Optional)
                    </Label>
                    <Input
                      id="additionalInfo"
                      name="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={handleInputChange}
                      placeholder="Delivery instructions, company name, etc."
                    />
                  </div>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>What Happens Next?</AlertTitle>
                  <AlertDescription>
                    <ol className="list-decimal ml-4 mt-2 space-y-1 text-sm">
                      <li>
                        You'll receive an invoice via email with our bank
                        details
                      </li>
                      <li>
                        Make full payment via SEPA bank transfer within 5
                        business days
                      </li>
                      <li>
                        Send payment confirmation to info@zoltantech-ltd.com
                      </li>
                      <li>
                        We'll confirm your order and arrange delivery within 30
                        days
                      </li>
                    </ol>
                  </AlertDescription>
                </Alert>

                {hasOutOfStockItems && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Checkout Disabled</AlertTitle>
                    <AlertDescription>
                      Some items in your cart are out of stock. Please remove them to proceed.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Link href="/" className="w-full">
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      size="lg"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting || hasOutOfStockItems}
                  >
                    <ShoppingCart />
                    {isSubmitting ? "Placing Order..." : "Place Order"}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  By placing an order, you agree to our{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>{cart.items.length} items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3 pb-3 border-b"
                  >
                    <div className="relative w-16 h-16 shrink-0 rounded overflow-hidden">
                      <img
                        src={resolvePublicImageUrl(item.product.image) ?? ""}
                        alt={item.product.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold">
                        €{item.product.price * item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">€{totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium">Calculated in invoice</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>€{totalAmount}</span>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Final amount including delivery costs will be specified in
                  your invoice
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
