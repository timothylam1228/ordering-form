import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(
          process.env.GOOGLE_APPLICATION_CREDENTIALS as string
        ),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      console.log(req.body);

      const sheets = google.sheets({ version: "v4", auth });
      const appendOrderItems = async (
        items: any[],
        orderId: string
      ): Promise<void> => {
        for (const item of items) {
          const { name, price } = item.item;
          const { category, quantity } = item; // Extract quantity here
          console.log("categories", category);

          for (let i = 0; i < quantity; i++) {
            // Loop based on quantity
            try {
              console.log("name", name);

              if (name.includes("+")) {
                let splitItems = name.split("+");
                splitItems = splitItems.map((item: string) => item.trim());
                for (let index = 0; index < splitItems.length; index++) {
                  //
                  await sheets.spreadsheets.values.append({
                    spreadsheetId: process.env.SHEET_ID,
                    range: "Summary!A3", // Adjust the range to where you want the data to start
                    valueInputOption: "USER_ENTERED",
                    requestBody: {
                      values: [
                        [
                          orderId, // Including the order ID
                          "Pending", // Status
                          item.category + -[index + 1], // Category or combined categories
                          splitItems[index], // Item name
                          index == 0 ? price : 0, // Price per item
                          new Date().toLocaleString("en-CA", {
                            timeZone: "America/Toronto",
                            dateStyle: "short",
                          }), // Current date in Toronto
                          new Date().toLocaleString("en-CA", {
                            timeZone: "America/Toronto",
                            timeStyle: "short",
                            hour12: false,
                          }), // Current time in Toronto
                        ],
                      ],
                    },
                  });
                }
              } else {
                await sheets.spreadsheets.values.append({
                  spreadsheetId: process.env.SHEET_ID,
                  range: "Summary!A3", // Adjust the range to where you want the data to start
                  valueInputOption: "USER_ENTERED",
                  requestBody: {
                    values: [
                      [
                        orderId, // Including the order ID
                        "Pending", // Status

                        item.category, // Category or combined categories
                        name, // Item name
                        price, // Price per item
                        new Date().toLocaleString("en-CA", {
                          timeZone: "America/Toronto",
                          dateStyle: "short",
                        }), // Current date in Toronto
                        new Date().toLocaleString("en-CA", {
                          timeZone: "America/Toronto",
                          timeStyle: "short",
                          hour12: false,
                        }), // Current time in Toronto
                      ],
                    ],
                  },
                });
              }
              console.log("Appended item:", name);
            } catch (err) {
              console.error("Error appending data to sheet:", err);
              throw new Error(`Failed to append item ${name}`);
            }
          }
        }
      };

      // Await the function and handle errors if they arise
      await appendOrderItems(req.body.items, req.body.orderId);

      res.status(200).json({ message: "Data added successfully" });
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
        res
          .status(500)
          .json({ error: `Error adding data to sheet: ${error.message}` });
      }
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
