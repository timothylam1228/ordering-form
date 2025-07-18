import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";

interface FlavorCount {
  name: string;
  count: number;
}

interface OrderItem {
  product: string;
  flavor: string;
  isHalf: boolean;
  price: number;
  quantity?: number;
  selectedFlavors?: FlavorCount[];
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

    console.log("Processing order:", req.body);

    const { orderId, items, socialDiscounts } = req.body as OrderRequest;

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
          let itemName = item.product;

          // Regular item
          itemName += ` - ${item.flavor}${item.isHalf ? " (Half)" : ""}`;

          // Only apply discounts to the first row of the order
          const rowDiscount = i === 0 ? totalDiscount : 0;
          const rowTotal = i === 0 ? finalTotal : 0;

          await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SHEET_ID,
            range: "north-york!A2", // Adjust range as needed
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [
                [
                  orderId,
                  "Pending",
                  itemName,
                  item.price,
                  rowDiscount,
                  rowTotal,
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
          throw new Error(`Failed to append item ${item.product}`);
        }
      }
    };

    await appendOrderItems(items, orderId, socialDiscounts);
    res.status(200).json({
      message: "Order processed successfully",
      waitingTime: "15-20 minutes",
    });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
