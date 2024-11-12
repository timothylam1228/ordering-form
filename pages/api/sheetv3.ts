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

    const { orderId, items } = req.body as OrderRequest;
    console.log("Processing order:", { orderId, items });

    const sheets = google.sheets({ version: "v4", auth });

    const appendOrderItems = async (
      items: OrderItem[],
      orderId: string
    ): Promise<void> => {
      for (const item of items) {
        try {
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

          // Create the item name combining product, flavor, and half portion info
          const itemName = `${item.product} - ${item.flavor}${
            item.isHalf ? " (Half)" : ""
          }`;

          await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SHEET_ID,
            range: "BlowChick!A3", // Adjust range as needed
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [
                [
                  orderId,
                  "Pending",
                  itemName,
                  item.price,
                  currentDate,
                  currentTime,
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

    await appendOrderItems(items, orderId);
    res.status(200).json({ message: "Order processed successfully" });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
