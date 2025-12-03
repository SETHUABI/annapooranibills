import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllBills, getSettings, createBill, deleteBill } from "@/lib/db";
import { Bill, AppSettings } from "@/types";
import {
  Download,
  FileDown,
  Calendar,
  Printer,
  Upload,
  Pencil,
} from "lucide-react";
import { exportBillsToExcel, exportBillsToCSV } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { generatePrintHTML } from "@/lib/print";
import * as XLSX from "xlsx";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Reports() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedPeriod, setSelectedPeriod] =
    useState<"today" | "week" | "month" | "all">("today");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { toast } = useToast();

  /* ------------------------------ LOAD DATA ------------------------------ */
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [billsData, settingsData] = await Promise.all([
        getAllBills(),
        getSettings(),
      ]);

      billsData.sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt));

      setBills(billsData);
      setSettings(settingsData || null);
    } catch {
      toast({
        title: "Error",
        description: "Unable to load report data",
        variant: "destructive",
      });
    }
  };

  /* ------------------------------ DATE PARSE ------------------------------ */
  const parseDate = (d: string): number => {
    if (!d) return 0;
    if (d.includes("T")) return new Date(d).getTime();

    const parts = d.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      return new Date(year, month - 1, day).getTime();
    }
    return new Date(d).getTime();
  };

  /* ------------------------------ FILTER ------------------------------ */
  const getFilteredBills = () => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();

    switch (selectedPeriod) {
      case "today":
        return bills.filter((b) => parseDate(b.createdAt) >= todayStart);

      case "week":
        return bills.filter(
          (b) =>
            parseDate(b.createdAt) >= todayStart - 7 * 24 * 60 * 60 * 1000
        );

      case "month":
        return bills.filter(
          (b) =>
            parseDate(b.createdAt) >= todayStart - 30 * 24 * 60 * 60 * 1000
        );

      default:
        return bills;
    }
  };

  const filteredBills = getFilteredBills();

  /* ------------------------------ SUMMARY ------------------------------ */
  const totalSales = filteredBills.reduce((t, b) => t + b.total, 0);
  const totalItems = filteredBills.reduce((t, b) => t + b.items.length, 0);
  const avgBillValue =
    filteredBills.length > 0 ? totalSales / filteredBills.length : 0;

  /* ------------------------------ EXPORT ------------------------------ */
  const handleExportExcel = () => {
    exportBillsToExcel(
      filteredBills,
      `bills-${selectedPeriod}-${Date.now()}.xlsx`
    );
    toast({ title: "Done", description: "Excel exported" });
  };

  const handleExportCSV = () => {
    exportBillsToCSV(
      filteredBills,
      `bills-${selectedPeriod}-${Date.now()}.csv`
    );
    toast({ title: "Done", description: "CSV exported" });
  };

  /* ------------------------------ IMPORT ------------------------------ */
  const handleImportExcel = async (event: any) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = async (e: any) => {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
          return toast({
            title: "Import Failed",
            description: "Excel has no rows",
            variant: "destructive",
          });
        }

        let saved = 0;

        for (const row of rows) {
          try {
            const bill: Bill = {
              id: row.id || crypto.randomUUID(),
              billNumber: row.billNumber || "BILL0000",
              createdAt: row.createdAt,
              createdByName: row.createdByName || "",
              paymentMethod: row.paymentMethod || "",
              total: Number(row.total) || 0,
              subtotal: Number(row.subtotal) || 0,
              cgst: Number(row.cgst) || 0,
              sgst: Number(row.sgst) || 0,
              items: JSON.parse(row.items),
              syncedToCloud: 0,
            };
            await createBill(bill);
            saved++;
          } catch {}
        }

        toast({
          title: "Import Complete",
          description: `Imported ${saved} bills successfully`,
        });

        loadData();
      };

      reader.readAsArrayBuffer(file);
    } catch {
      toast({
        title: "Import Failed",
        description: "Invalid excel file",
        variant: "destructive",
      });
    }
  };

  /* ------------------------------ PRINT RANGE ------------------------------ */
  const handlePrintRange = () => {
    if (!fromDate || !toDate) {
      return toast({
        title: "Select Dates",
        description: "Choose both From and To date",
        variant: "destructive",
      });
    }

    const start = new Date(fromDate).getTime();
    const end = new Date(toDate).getTime() + 24 * 60 * 60 * 1000;

    const list = bills.filter((b) => {
      const t = parseDate(b.createdAt);
      return t >= start && t <= end;
    });

    if (list.length === 0) {
      return toast({
        title: "No Bills",
        description: "No bills in selected range",
      });
    }

    if (!settings) {
      return toast({
        title: "Error",
        description: "Settings not loaded",
        variant: "destructive",
      });
    }

    let fullHTML = "";

    list.forEach((bill, index) => {
      fullHTML += generatePrintHTML(bill, settings);

      if (index !== list.length - 1) {
        fullHTML += `<div style="page-break-after: always; margin:30px 0;"></div>`;
      }
    });

    const win = window.open("", "_blank");
    win.document.write(fullHTML);
    win.document.close();

    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  /* ------------------------------ UI ------------------------------ */
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
            <FileDown className="mr-2 h-4 w-4" />
            CSV
          </Button>

          <Button onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>

          <Button variant="outline" onClick={loadData}>
            Refresh
          </Button>

          <label className="cursor-pointer">
            <div className="flex items-center px-3 py-2 border rounded">
              <Upload className="h-4 w-4 mr-2" /> Import
            </div>
            <input type="file" className="hidden" onChange={handleImportExcel} />
          </label>
        </div>
      </div>

      {/* PERIOD BUTTONS */}
      <div className="flex gap-2">
        {(["today", "week", "month", "all"] as const).map((p) => (
          <Button
            key={p}
            variant={selectedPeriod === p ? "default" : "outline"}
            onClick={() => setSelectedPeriod(p)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {p.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* PRINT RANGE */}
      <Card className="p-4">
        <CardTitle className="text-lg">Print Bills (Date Range)</CardTitle>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
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

      {/* SUMMARY */}
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
          <CardContent className="text-3xl font-bold">
            {totalItems}
          </CardContent>
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

                      <TableCell className="text-right flex gap-2 justify-end">

                        {/* VIEW BUTTON */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (settings) {
                              const win = window.open("", "_blank");
                              win.document.write(generatePrintHTML(bill, settings));
                              win.document.close();
                            }
                          }}
                        >
                          View
                        </Button>

                        {/* PRINT BUTTON */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (settings) {
                              const w = window.open("", "_blank");
                              w.document.write(generatePrintHTML(bill, settings));
                              w.document.close();
                              setTimeout(() => {
                                w.print();
                                w.close();
                              }, 250);
                            }
                          }}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>

                        {/* EDIT BUTTON */}
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-blue-600 text-white"
                          onClick={() => {
                            localStorage.setItem("editBill", JSON.stringify(bill));
                            window.location.href = "/billing";
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>

                        {/* DELETE BUTTON */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (!confirm("Delete this bill?")) return;

                            try {
                              await deleteBill(bill.id);
                              toast({
                                title: "Deleted",
                                description: "Bill removed successfully",
                              });
                              loadData();
                            } catch {
                              toast({
                                title: "Error",
                                description: "Failed to delete bill",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Delete
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
