import { parse } from 'csv-parse/sync';
import fetch from 'node-fetch';

const CSV_URL = 'https://raw.githubusercontent.com/ElliottIan397/get_skus_by_printer/main/printers_table.csv';

export default async function handler(req, res) {
  const { printer_model } = req.query;

  if (!printer_model) {
    return res.status(400).json({ error: "Missing 'printer_model' query parameter" });
  }

  try {
    const response = await fetch(CSV_URL);
    const csvText = await response.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true
    });

    const normalize = str => str.replace(/["']/g, '').trim().toLowerCase();
    const normalizedInput = normalize(printer_model);

    const match = records.find(row =>
      normalize(row.Printer_Name || '') === normalizedInput
    );

    if (!match) {
      return res.status(404).json({ error: 'Printer model not found', printer_model });
    }

    let sku_list = match.Consumable_Sku || '';
    const cleaned = sku_list
      .split(',')
      .map(sku => sku.trim())
      .filter(sku => sku.length > 0);

    return res.status(200).json({
      printer_model: match.Printer_Name,
      sku_list: cleaned // ✅ FIXED: field now named correctly
    });
  } catch (err) {
    console.error('Failed to fetch or parse CSV:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
