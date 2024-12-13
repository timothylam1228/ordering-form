import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";

interface OrderItem {
  product: string;
  flavor: string;
  isHalf: boolean;
  price: number;
}

interface OrderRequest {
  orderId: string;
  socialDiscounts: {
    followedInstagram: boolean;
    repostedStory: boolean;
  };
  items: OrderItem[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(
        process.env.GOOGLE_APPLICATION_CREDENTIALS as string
      ),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const { orderId, items, socialDiscounts } = req.body as OrderRequest;
    console.log("Processing order:", { orderId, items, socialDiscounts });

    const sheets = google.sheets({ version: "v4", auth });

    const appendOrderItems = async (
      items: OrderItem[],
      orderId: string,
      socialDiscounts: {
        followedInstagram: boolean;
        repostedStory: boolean;
      }
    ): Promise<void> => {
      // Calculate total discount
      let totalDiscount = 0;
      if (socialDiscounts.followedInstagram) totalDiscount += 1;
      if (socialDiscounts.repostedStory) totalDiscount += 1;

      // Calculate subtotal
      const subtotal = items.reduce((sum, item) => sum + item.price, 0);
      
      // Calculate final total
      const finalTotal = Math.max(subtotal - totalDiscount, 0);

      // Get current date and time in Toronto timezone
      const currentDate = new Date().toLocaleString("en-CA", {
        timeZone: "America/Toronto",
        dateStyle: "short",
      });
      const currentTime = new Date().toLocaleString("en-CA", {
        timeZone: "America/Toronto",
        timeStyle: "short",
        hour12: false,
      });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          // Create the item name combining product, flavor, and half portion info
          const itemName = `${item.product} - ${item.flavor}${
            item.isHalf ? " (Half)" : ""
          }`;

          // Only apply discounts to the first row of the order
          const rowDiscount = i === 0 ? totalDiscount : 0;
          const rowTotal = i === 0 ? finalTotal : 0;

          await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SHEET_ID,
            range: "bittersweetv2!A2", // Adjust range as needed
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [
                [
                  orderId,
                  "Pending",
                  itemName,
                  item.price, // Original item price
                  rowDiscount, // Discount amount (only on first row)
                  rowTotal, // Final total (discounted on first row only)
                  currentDate,
                  currentTime,
                  socialDiscounts.followedInstagram,
                  socialDiscounts.repostedStory,
                  
                ],
              ],
            },
          });

          console.log("Appended item:", itemName);
        } catch (err) {
          console.error("Error appending data to sheet:", err);
          throw new Error(
            `Failed to append item ${item.product} - ${item.flavor}`
          );
        }
      }
    };

    await appendOrderItems(items, orderId, socialDiscounts);
    res.status(200).json({ message: "Order processed successfully" });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}