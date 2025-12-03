import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllBills, getSettings } from "@/lib/db";
import { Bill, AppSettings } from "@/types";
import { Download, FileDown, Calendar, Printer, Upload } from "lucide-react";
import { exportBillsToExcel, exportBillsToCSV } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { printBill } from "@/lib/print";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// IMPORT XLSX FOR IMPORT OPTION
import * as XLSX from "xlsx";

export default function Reports() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedPeriod, setSelectedPeriod] =
    useState<"today" | "week" | "month" | "all">("today");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { toast } = useToast();

  /* -------------------------------- LOAD DATA ------------------------------- */

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [billsData, settingsData] = await Promise.all([
        getAllBills(),
        getSettings(),
      ]);

      // Sort latest first
      billsData.sort(
        (a, b) =>
          parseDDMMYYYY(b.createdAt) - parseDDMMYYYY(a.createdAt)
      );

      setBills(billsData);
      setSettings(settingsData || null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load reports data",
        variant: "destructive",
      });
    }
  };

  /* ---------------------------- FIX DATE PARSING ---------------------------- */
  // Convert "dd/mm/yyyy" → Date
  const parseDDMMYYYY = (d: string): number => {
    if (!d) return 0;
    const [day, month, year] = d.split("/").map(Number);
    return new Date(year, month - 1, day).getTime();
  };

  /* ------------------------------ FILTER BILLS ------------------------------ */

  const getFilteredBills = () => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    switch (selectedPeriod) {
      case "today":
        return bills.filter(
          (b) => parseDDMMYYYY(b.createdAt) >= todayStart
        );

      case "week":
        const weekAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
        return bills.filter(
          (b) => parseDDMMYYYY(b.createdAt) >= weekAgo
        );

      case "month":
        const monthAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
        return bills.filter(
          (b) => parseDDMMYYYY(b.createdAt) >= monthAgo
        );

      default:
        return bills;
    }
  };

  const filteredBills = getFilteredBills();

  /* ---------------------------- SUMMARY CALCULATE --------------------------- */

  const totalSales = filteredBills.reduce((sum, b) => sum + b.total, 0);
  const totalItems = filteredBills.reduce((sum, b) => sum + b.items.length, 0);
  const avgBillValue =
    filteredBills.length > 0 ? totalSales / filteredBills.length : 0;

  /* ------------------------------ EXPORT BUTTONS ---------------------------- */

  const handleExportExcel = () => {
    exportBillsToExcel(
      filteredBills,
      `bills-${selectedPeriod}-${Date.now()}.xlsx`
    );
    toast({ title: "Exported", description: "Excel file created" });
  };

  const handleExportCSV = () => {
    exportBillsToCSV(
      filteredBills,
      `bills-${selectedPeriod}-${Date.now()}.csv`
    );
    toast({ title: "Exported", description: "CSV file created" });
  };

  /* --------------------------- IMPORT DATA (EXCEL) -------------------------- */

  const handleImportExcel = (event: any) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const json = XLSX.utils.sheet_to_json(sheet);

        toast({
          title: "Imported",
          description: `Loaded ${json.length} rows (not saved to DB)`,
        });
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      toast({
        title: "Import Failed",
        description: "Invalid Excel file",
        variant: "destructive",
      });
    }
  };

  /* -------------------------- PRINT MULTIPLE BILLS ------------------------- */

  const handlePrintRange = () => {
    if (!fromDate || !toDate) {
      return toast({
        title: "Select dates",
        description: "You must select both From & To",
        variant: "destructive",
      });
    }

    const start = new Date(fromDate).getTime();
    const end = new Date(toDate).getTime() + 24 * 60 * 60 * 1000; // include full day

    const billsInRange = bills.filter((b) => {
      const billDate = parseDDMMYYYY(b.createdAt);
      return billDate >= start && billDate <= end;
    });

    if (billsInRange.length === 0) {
      return toast({
        title: "No bills",
        description: "No bills found in selected date range",
      });
    }

    printBillsRange(billsInRange, settings!);
  };

  const printBillsRange = (bills: Bill[], settings: AppSettings) => {
    const html = bills
      .map((b) => generateBillHTML(b, settings))
      .join('<div style="page-break-after: always;"></div>');

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();

    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  const generateBillHTML = (bill: Bill, settings: AppSettings) =>
    printBill(bill, settings); // uses your existing print format

  /* ----------------------------- UI TEMPLATE ------------------------------- */

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Reports</h1>
          <p className="text-muted-foreground">View sales reports & analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <FileDown className="mr-2 h-4 w-4" /> CSV
          </Button>

          <Button onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>

          <Button variant="outline" onClick={loadData}>
            Refresh
          </Button>

          {/* IMPORT EXCEL */}
          <label className="cursor-pointer">
            <div className="flex items-center px-3 py-2 border rounded">
              <Upload className="h-4 w-4 mr-2" /> Import
            </div>
            <input type="file" className="hidden" onChange={handleImportExcel} />
          </label>
        </div>
      </div>

      {/* PERIOD SELECTOR */}
      <div className="flex gap-2">
        {(["today", "week", "month", "all"] as const).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? "default" : "outline"}
            onClick={() => setSelectedPeriod(period)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {period.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* DATE RANGE PRINT */}
      <Card className="p-4">
        <CardTitle className="mb-2 text-lg">Print Bills (Date Range)</CardTitle>

        <div className="grid md:grid-cols-3 gap-4 mt-3">
          <input
            type="date"
            className="border p-2 rounded"
            onChange={(e) => setFromDate(e.target.value)}
          />

          <input
            type="date"
            className="border p-2 rounded"
            onChange={(e) => setToDate(e.target.value)}
          />

          <Button onClick={handlePrintRange}>
            <Printer className="mr-2 h-4 w-4" /> Print All
          </Button>
        </div>
      </Card>

      {/* SUMMARY CARDS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-primary">
            {settings?.currency || "₹"}
            {totalSales.toFixed(2)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Bill</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {settings?.currency || "₹"}
            {avgBillValue.toFixed(2)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Bills</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {filteredBills.length}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items Sold</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalItems}</CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBills.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No bills for this period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredBills.slice(0, 50).map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>{bill.billNumber}</TableCell>
                      <TableCell>{bill.createdAt}</TableCell>
                      <TableCell>{bill.createdByName}</TableCell>
                      <TableCell>{bill.items.length}</TableCell>
                      <TableCell>{bill.paymentMethod}</TableCell>
                      <TableCell className="text-right font-bold">
                        {settings?.currency}
                        {bill.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => printBill(bill, settings!)}
                        >
                          <Printer className="h-4 w-4 mr-1" /> Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
