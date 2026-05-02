import { redirect } from "@sveltejs/kit";
import { desktopApiFetch, isDesktopBuild } from "$lib/desktop";

type Invoice = {
  id: string;
  invoiceNumber: string;
  customer?: { name?: string };
  issueDate?: string | Date;
  updatedAt?: string | Date;
  currency?: string;
  status?: "draft" | "sent" | "complete" | "paid" | "overdue" | "voided";
  total?: number;
};

export const load = async ({ parent }) => {
  if (!isDesktopBuild()) return {};

  const layoutData = await parent();
  if (!layoutData.user) {
    throw redirect(303, "/login");
  }

  const user = layoutData.user;
  const canViewInvoices =
    user.isAdmin ||
    user.permissions?.some(
      (p: { resource: string; action: string }) =>
        p.resource === "invoices" && p.action === "read",
    );
  const canViewCustomers =
    user.isAdmin ||
    user.permissions?.some(
      (p: { resource: string; action: string }) =>
        p.resource === "customers" && p.action === "read",
    );

  try {
    const [invoices, customers, settings, version] = await Promise.all([
      canViewInvoices
        ? desktopApiFetch("/api/v1/invoices").then((res) => res.json() as Promise<Invoice[]>)
        : Promise.resolve([] as Invoice[]),
      canViewCustomers
        ? desktopApiFetch("/api/v1/customers").then((res) => res.json() as Promise<unknown[]>)
        : Promise.resolve([] as unknown[]),
      desktopApiFetch("/api/v1/settings")
        .then((res) => (res.ok ? res.json() : {}))
        .catch(() => ({})),
      fetch("./VERSION")
        .then((res) => (res.ok ? res.text() : "unknown"))
        .then((text) => text.trim() || "unknown")
        .catch(() => "unknown"),
    ]);

    const currency = invoices[0]?.currency || "USD";
    const dateFormat = String(settings.dateFormat || "YYYY-MM-DD");
    const billed = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const paid = invoices
      .filter((invoice) => invoice.status === "paid" || invoice.status === "complete")
      .reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const outstanding = invoices
      .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue")
      .reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const status = {
      draft: invoices.filter((invoice) => invoice.status === "draft").length,
      sent: invoices.filter((invoice) => invoice.status === "sent").length,
      complete: invoices.filter((invoice) => invoice.status === "complete").length,
      paid: invoices.filter((invoice) => invoice.status === "paid").length,
      overdue: invoices.filter((invoice) => invoice.status === "overdue").length,
      voided: invoices.filter((invoice) => invoice.status === "voided").length,
    };

    const recent = invoices
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.issueDate || 0).getTime() -
          new Date(a.updatedAt || a.issueDate || 0).getTime(),
      )
      .slice(0, 5);

    return {
      counts: { invoices: invoices.length, customers: customers.length },
      money: { billed, paid, outstanding, currency },
      status,
      recent,
      version,
      dateFormat,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
};
