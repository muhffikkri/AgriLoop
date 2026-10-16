import type { Role } from "@/lib/server/db.ts";

export type NavItem = { href: string; label: string };

export const ROLE_NAV: Record<Role, NavItem[]> = {
  farmer: [
    { href: "/farmer/dashboard", label: "Overview" },
    { href: "/farmer/supply", label: "My supply" },
    { href: "/farmer/offers", label: "Offers" },
    { href: "/farmer/collections", label: "Pickups" },
    { href: "/farmer/profile", label: "Profile" },
  ],
  buyer: [
    { href: "/buyer/dashboard", label: "Overview" },
    { href: "/buyer/requirements", label: "Requirements" },
    { href: "/buyer/marketplace", label: "Find supply" },
    { href: "/buyer/matches", label: "Match reasons" },
    { href: "/buyer/orders", label: "Orders" },
    { href: "/buyer/profile", label: "Organisation" },
  ],
  aggregator: [
    { href: "/aggregator/dashboard", label: "Overview" },
    { href: "/aggregator/available-lots", label: "Available work" },
    { href: "/aggregator/collections", label: "Pickup plans" },
    { href: "/aggregator/routes", label: "Route notes" },
    { href: "/aggregator/profile", label: "Profile" },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/areas", label: "Areas" },
    { href: "/admin/grid-samples", label: "Demo grids" },
    { href: "/admin/transactions", label: "Transactions" },
    { href: "/admin/data-quality", label: "Data quality" },
    { href: "/admin/audit-log", label: "Audit" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  farmer: "Farmer workspace",
  buyer: "Buyer workspace",
  aggregator: "Collector workspace",
  admin: "Programme admin",
};
