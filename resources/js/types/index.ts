import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export type StoreRole = 'owner' | 'manager';

export interface StoreSummary {
    id: number;
    name: string;
}

export interface CurrentStore extends StoreSummary {
    public_token: string;
    role: StoreRole;
    pending_sales_count: number;
}

export interface Flash {
    success?: string | null;
    error?: string | null;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    userStores: StoreSummary[];
    currentStore: CurrentStore | null;
    flash: Flash;
    [key: string]: unknown;
}

export interface Category {
    id: number;
    name: string;
}

export interface Product {
    id: number;
    name: string;
    barcode: string | null;
    price: number;
    stock: number;
    min_stock: number;
    category_id: number | null;
    image_url: string | null;
    is_active: boolean;
}

export interface PaymentMethodOption {
    value: string;
    label: string;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
