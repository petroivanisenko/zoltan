"use server";

import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

type OrderItem = {
  productId?: number;
  product: {
    name: string;
    price: number;
  };
  quantity: number;
};

type PlaceOrderParams = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  additionalInfo?: string;
  items: OrderItem[];
  totalAmount: number;
};

export async function placeOrder(data: PlaceOrderParams) {
  const {
    fullName,
    email,
    phone,
    country,
    city,
    address,
    postalCode,
    additionalInfo,
    items,
    totalAmount,
  } = data;

  const orderId = `ORD-${Date.now()}`;

  try {
    // Validate that all items are in stock in the database
    const productIds = items.map((item) => item.productId).filter((id): id is number => typeof id === "number");
    if (productIds.length > 0) {
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, inStock: true, name: true }
      });
      
      const outOfStockProducts = dbProducts.filter((p) => !p.inStock);
      if (outOfStockProducts.length > 0) {
        const names = outOfStockProducts.map((p) => p.name).join(", ");
        return {
          success: false,
          error: `The following items are out of stock: ${names}. Please remove them from your cart.`
        };
      }
      
      const foundIds = dbProducts.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      if (missingIds.length > 0) {
        return {
          success: false,
          error: "Some items in your cart are no longer available. Please clear your cart and try again."
        };
      }
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST) {
      console.log("SMTP not configured. Simulating email sending.");
      console.log("Order Details:", JSON.stringify(data, null, 2));
      return {
        success: true,
        orderId: `${orderId}-SIMULATED`,
      };
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Generate Invoice HTML for Corporate
    const invoiceHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1>New Order Received: ${orderId}</h1>
        <h2>Customer Details</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Address:</strong> ${address}, ${city}, ${postalCode}, ${country}</p>
        ${additionalInfo ? `<p><strong>Additional Info:</strong> ${additionalInfo}</p>` : ""}

        <h2>Order Items</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Quantity</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Price</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.product.name}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">€${item.product.price}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">€${item.product.price * item.quantity}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold;">€${totalAmount}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    // Generate Customer Email HTML
    const customerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #333;">ZoltanTech LTD</h1>
        </div>

        <p>Dear ${fullName},</p>

        <p>Thank you for your order!</p>

        <p>We will contact you shortly to clarify delivery and payment details.</p>

        <h3>Order Summary (${orderId})</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 1px solid #eee;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: right;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${item.product.name}</td>
                <td style="padding: 10px; text-align: right;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right;">€${item.product.price}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <p style="text-align: right; font-size: 18px; font-weight: bold;">Total Amount: €${totalAmount}</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>ZoltanTech LTD</p>
          <p>3rd Floor, 86-90, Paul Street, London, England, EC2A 4NE</p>
          <p>Email: info@zoltantech-ltd.com</p>
        </div>
      </div>
    `;

    // Send email to Corporate
    await transporter.sendMail({
      from: '"ZoltanTech Store" <noreply@zoltantech-ltd.com>',
      to: "info@zoltantech-ltd.com",
      subject: `New Order #${orderId} - Invoice Generated`,
      html: invoiceHtml,
    });

    // Send email to Customer
    await transporter.sendMail({
      from: '"ZoltanTech LTD" <info@zoltantech-ltd.com>',
      to: email,
      subject: "Thank you for your order! - ZoltanTech LTD",
      html: customerHtml,
    });

    return { success: true, orderId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to process order" };
  }
}
